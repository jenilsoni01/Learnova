// FILE: server/controllers/enrollment.controller.js
// PURPOSE: Handle learner enrollments with integrated Razorpay payment flow.

import crypto from 'crypto';
import Razorpay from 'razorpay';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Payment from '../models/Payment.js';
import { computeCompletionPct } from '../utils/progress.utils.js';
import { sendPaymentSuccessEmail } from '../utils/paymentMail.service.js';
// ---------------------------------------------------------------------------
// Razorpay instance (shared, created once)
// ---------------------------------------------------------------------------
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const generateReceiptId = () =>
  `rcpt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

/** Returns true when a course requires payment. */
const courseRequiresPayment = (course) =>
  course.accessRule === 'payment' && course.price > 0;

// ---------------------------------------------------------------------------
// GET /enrollments/me
// ---------------------------------------------------------------------------
export const getMyEnrollments = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;
    const { search } = req.query;

    const filter = { learner: req.user._id };

    // If search is provided, find matching course IDs first
    if (search?.trim()) {
      const matchingCourses = await Course.find({
        title: { $regex: search.trim(), $options: 'i' }
      }).select('_id').lean();
      filter.course = { $in: matchingCourses.map(c => c._id) };
    }

    const [enrollments, totalItems] = await Promise.all([
      Enrollment.find(filter)
        .populate('course', 'title coverImage description tags accessRule price')
        .sort('-enrolledAt')
        .skip(skip)
        .limit(limit),
      Enrollment.countDocuments(filter)
    ]);

    const result = await Promise.all(
      enrollments.map(async (enrollment) => {
        const completion = await computeCompletionPct(
          enrollment._id,
          enrollment.course._id
        );
        return {
          _id: enrollment._id,
          status: enrollment.status,
          completionPct: completion.completionPct,
          course: enrollment.course,
        };
      })
    );

    const totalPages  = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;

    return res.json({
      data: result,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNextPage,
        hasPrevPage: page > 1,
        limit
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /enrollments/:courseId
// - Free  → direct enrollment
// - Paid  → create / reuse Razorpay order, return checkout details
// ---------------------------------------------------------------------------
export const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // ── 1. Fetch course ──────────────────────────────────────────────────
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    if (!course.isPublished) {
      return res
        .status(400)
        .json({ message: 'This course is not available for enrollment' });
    }

    // ── 2. Already enrolled? ─────────────────────────────────────────────
    const existing = await Enrollment.findOne({
      course: courseId,
      learner: req.user._id,
    });
    if (existing) {
      return res.json({
        success: true,
        enrolled: true,
        enrollment: existing,
        message: 'Already enrolled in this course',
      });
    }

    // ── 3. Invitation-only gate ──────────────────────────────────────────
    if (course.accessRule === 'invitation') {
      return res.status(403).json({
        success: false,
        message: 'This course is invitation-only',
        requiresInvitation: true,
      });
    }

    // ── 4. Free course → enroll immediately ─────────────────────────────
    if (!courseRequiresPayment(course)) {
      const enrollment = await Enrollment.create({
        course: courseId,
        learner: req.user._id,
        status: 'yet_to_start',
      });
      return res.status(201).json({
        success: true,
        enrolled: true,
        enrollment,
        message: 'Successfully enrolled in course',
      });
    }

    // ── 5. Paid course: already paid → enroll immediately ────────────────
    const hasPaid = await Payment.hasUserPaidForCourse(req.user._id, courseId);
    if (hasPaid) {
      const enrollment = await Enrollment.create({
        course: courseId,
        learner: req.user._id,
        status: 'yet_to_start',
      });
      return res.status(201).json({
        success: true,
        enrolled: true,
        enrollment,
        message: 'Successfully enrolled in course',
      });
    }

    // ── 6. Reuse a recent pending order (within 30 min) ──────────────────
    const pendingPayment = await Payment.findOne({
      user: req.user._id,
      course: courseId,
      status: 'created',
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
    });

    if (pendingPayment) {

      // make payment 
      
      const options = {
        amount: pendingPayment.amount * 100, // paise
        currency: pendingPayment.currency,
        receipt: pendingPayment.receipt,
        payment_capture: 1,
      }

      const order = await razorpay.orders.create(options);

      if(!order) {
        return res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
      }

      console.log('Reusing existing pending order:', order);

      return res.status(200).json({
        success: true,
        enrolled: false,
        requiresPayment: true,
        order: order,
        course: {
          id: course._id,
          title: course.title,
          price: course.price,
          currency: course.currency || 'INR',
        },
        key: process.env.RAZORPAY_KEY_ID,
        message: 'Complete payment to enroll',
      });
    }

    // ── 7. Create a fresh Razorpay order ─────────────────────────────────
    const receipt = generateReceiptId();
    const amountInPaise = Math.round(course.price * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: course.currency || 'INR',
      receipt,
      payment_capture: 1,
      notes: {
        courseId: course._id.toString(),
        userId: req.user._id.toString(),
        courseTitle: course.title,
      },
    });

    await Payment.create({
      user: req.user._id,
      course: course._id,
      amount: course.price,
      currency: course.currency || 'INR',
      razorpay_order_id: razorpayOrder.id,
      receipt,
      status: 'created',
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
    });

    return res.status(200).json({
      success: true,
      enrolled: false,
      requiresPayment: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount, // already in paise from Razorpay
        currency: razorpayOrder.currency,
        receipt,
      },
      course: {
        id: course._id,
        title: course.title,
        price: course.price,
        currency: course.currency || 'INR',
      },
      key: process.env.RAZORPAY_KEY_ID,
      message: 'Complete payment to enroll',
    });
  } catch (error) {
    console.error('enrollCourse error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /enrollments/verify-payment
// Called by the frontend after the Razorpay checkout modal closes successfully.
// ---------------------------------------------------------------------------
export const verifyPaymentAndEnroll = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing payment verification details' });
    }

    // ── 1. Load payment record ───────────────────────────────────────────
    const payment = await Payment.findByOrderId(razorpay_order_id);
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: 'Payment record not found' });
    }

    // ── 2. Ownership check ───────────────────────────────────────────────
    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Payment does not belong to this user',
      });
    }

    // ── 3. Idempotency: already captured ────────────────────────────────
    if (payment.status === 'captured') {
      const enrollment = await Enrollment.findOne({
        course: payment.course,
        learner: req.user._id,
      }).populate('course', 'title coverImage');

      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
        enrolled: true,
        enrollment,
      });
    }

    // ── 4. HMAC signature verification ──────────────────────────────────
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Use model instance method for clean status update
      await payment.markAsFailed(
        'SIGNATURE_INVALID',
        'Payment signature verification failed'
      );
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature',
      });
    }

    // ── 5. Mark payment captured (model instance method) ────────────────
    await payment.markAsCaptured(razorpay_payment_id, razorpay_signature);

    // ── 6. Create enrollment (upsert to stay idempotent) ─────────────────
    let enrollment = await Enrollment.findOne({
      course: payment.course,
      learner: req.user._id,
    });

    if (!enrollment) {
      enrollment = await Enrollment.create({
        course: payment.course,
        learner: req.user._id,
        status: 'yet_to_start',
      });
    }

    await enrollment.populate('course', 'title coverImage description');
    // ── 7. Send confirmation email (best effort) ─────────────────────────
     await sendPaymentSuccessEmail({
      to: req.user.email,
      name: req.user.name,
      courseTitle: enrollment.course.title,
      amount: payment.amount,
      currency: payment.currency,
      razorpayPaymentId: payment.razorpay_payment_id,
      orderId: payment.razorpay_order_id,
      paidAt: payment.verifiedAt,
    }).then((emailResult) => {
      if (emailResult.sent) {
        console.log(`Payment success email sent to ${req.user.email}`); 
      } else {
        console.warn(`Failed to send payment success email to ${req.user.email}: ${emailResult.reason}`);
      }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Payment verified and enrollment completed successfully',
      enrolled: true,
      enrollment,
      payment: {
        id: payment._id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error('verifyPaymentAndEnroll error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------------------
// POST /enrollments/webhook
// Razorpay server-to-server webhook — handles async payment events.
// Register this URL in your Razorpay dashboard under Webhooks.
// Set RAZORPAY_WEBHOOK_SECRET in your .env
// ---------------------------------------------------------------------------
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const receivedSignature = req.headers['x-razorpay-signature'];

    // Verify webhook authenticity
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== receivedSignature) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const { event, payload } = req.body;
    const razorpayPayment = payload?.payment?.entity;

    if (!razorpayPayment) {
      return res.status(200).json({ message: 'No payment entity in payload' });
    }

    const payment = await Payment.findOne({
      razorpay_order_id: razorpayPayment.order_id,
    });

    if (!payment) {
      // Not our order — acknowledge and move on
      return res.status(200).json({ message: 'Order not found, skipping' });
    }

    switch (event) {
      case 'payment.captured': {
        if (payment.status !== 'captured') {
          await payment.markAsCaptured(
            razorpayPayment.id,
            razorpayPayment.signature || ''
          );

          // Ensure enrollment exists
          const enrollmentExists = await Enrollment.exists({
            course: payment.course,
            learner: payment.user,
          });

          if (!enrollmentExists) {
            await Enrollment.create({
              course: payment.course,
              learner: payment.user,
              status: 'yet_to_start',
            });
          }
        }
        break;
      }

      case 'payment.failed': {
        if (payment.status !== 'captured') {
          await payment.markAsFailed(
            razorpayPayment.error_code || 'PAYMENT_FAILED',
            razorpayPayment.error_description || 'Payment failed via webhook'
          );
        }
        break;
      }

      default:
        // Unhandled event — still acknowledge
        break;
    }

    return res.status(200).json({ message: 'Webhook processed' });
  } catch (error) {
    console.error('handleRazorpayWebhook error:', error);
    return res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /enrollments/:courseId/status
// ---------------------------------------------------------------------------
export const checkEnrollmentStatus = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const enrollment = await Enrollment.findOne({
      course: courseId,
      learner: req.user._id,
    });

    // Free / open course
    if (!courseRequiresPayment(course)) {
      return res.json({
        isEnrolled: !!enrollment,
        requiresPayment: false,
        canAccess: !!enrollment,
        enrollment: enrollment || null,
      });
    }

    // Paid course
    const payment = await Payment.findOne({
      user: req.user._id,
      course: courseId,
      status: 'captured',
    });

    return res.json({
      isEnrolled: !!enrollment,
      requiresPayment: true,
      hasPaid: !!payment,
      canAccess: !!enrollment && !!payment,
      enrollment: enrollment || null,
      payment: payment
        ? {
            status: payment.status,
            amount: payment.amount,
            currency: payment.currency,
            paidAt: payment.verifiedAt,
          }
        : null,
      coursePrice: course.price,
      courseCurrency: course.currency || 'INR',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------------------------
// GET /courses/:courseId/enrollments  (instructor / admin)
// ---------------------------------------------------------------------------
export const getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (
      req.user.role !== 'admin' &&
      String(course.createdBy) !== String(req.user._id)
    ) {
      return res
        .status(403)
        .json({ message: 'Not authorized to view course enrollments' });
    }

    const enrollments = await Enrollment.find({ course: courseId })
      .populate('learner', 'name email avatar totalPoints badgeLevel')
      .sort('-enrolledAt');

    return res.json(enrollments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};