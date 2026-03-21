/**
 * Payment Controller
 *
 * Handles all payment-related operations including:
 * - Creating Razorpay orders
 * - Verifying payment signatures
 * - Processing successful payments and creating enrollments
 * - Payment status checks and history
 */

import crypto from 'crypto';
import Razorpay from 'razorpay';
import Payment from '../models/Payment.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Generate unique receipt ID for each transaction
 */
const generateReceiptId = () => {
  return `rcpt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
};

/**
 * @desc    Create a Razorpay order for course purchase
 * @route   POST /api/payments/create-order
 * @access  Private (Learner)
 */
export const createOrder = asyncHandler(async (req, res, next) => {
  const { courseId } = req.body;

  if (!courseId) {
    return next(new ApiError(400, 'Course ID is required'));
  }

  // 1. Find the course
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new ApiError(404, 'Course not found'));
  }

  // 2. Check if course is published
  if (!course.isPublished) {
    return next(new ApiError(400, 'This course is not available for enrollment'));
  }

  // 3. Check if course requires payment
  if (course.accessRule !== 'payment' || course.price <= 0) {
    return next(new ApiError(400, 'This course does not require payment. Use direct enrollment.'));
  }

  // 4. Check if user is already enrolled
  const existingEnrollment = await Enrollment.findOne({
    course: courseId,
    learner: req.user._id
  });

  if (existingEnrollment) {
    return next(new ApiError(400, 'You are already enrolled in this course'));
  }

  // 5. Check if user already has a successful payment
  const existingPayment = await Payment.hasUserPaidForCourse(req.user._id, courseId);
  if (existingPayment) {
    return next(new ApiError(400, 'You have already paid for this course'));
  }

  // 6. Check for pending payments (prevent duplicate orders)
  const pendingPayment = await Payment.findOne({
    user: req.user._id,
    course: courseId,
    status: 'created',
    // Only consider payments created in the last 30 minutes
    createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
  });

  if (pendingPayment) {
    // Return existing order instead of creating a new one
    return res.status(200).json({
      success: true,
      message: 'Existing order found',
      data: {
        orderId: pendingPayment.razorpay_order_id,
        amount: pendingPayment.amount,
        currency: pendingPayment.currency,
        receipt: pendingPayment.receipt,
        courseId: course._id,
        courseTitle: course.title,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  }

  // 7. Create Razorpay order
  const receipt = generateReceiptId();
  const amountInPaise = Math.round(course.price * 100); // Razorpay expects amount in paise

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: course.currency || 'INR',
    receipt: receipt,
    notes: {
      courseId: course._id.toString(),
      userId: req.user._id.toString(),
      courseTitle: course.title
    }
  });

  // 8. Save payment record in database
  const payment = await Payment.create({
    user: req.user._id,
    course: course._id,
    amount: course.price,
    currency: course.currency || 'INR',
    razorpay_order_id: razorpayOrder.id,
    receipt: receipt,
    status: 'created',
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent')
  });

  // 9. Return order details to frontend
  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: receipt,
      courseId: course._id,
      courseTitle: course.title,
      key: process.env.RAZORPAY_KEY_ID,
      paymentId: payment._id
    }
  });
});

/**
 * @desc    Verify Razorpay payment signature and complete enrollment
 * @route   POST /api/payments/verify
 * @access  Private (Learner)
 */
export const verifyPayment = asyncHandler(async (req, res, next) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = req.body;

  // 1. Validate required fields
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return next(new ApiError(400, 'Missing payment verification details'));
  }

  // 2. Find the payment record
  const payment = await Payment.findByOrderId(razorpay_order_id);
  if (!payment) {
    return next(new ApiError(404, 'Payment record not found'));
  }

  // 3. Verify payment belongs to the requesting user
  if (payment.user.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, 'Unauthorized: Payment does not belong to this user'));
  }

  // 4. Check if already processed
  if (payment.status === 'captured') {
    // Payment already verified, check enrollment
    const enrollment = await Enrollment.findOne({
      course: payment.course,
      learner: req.user._id
    });

    return res.status(200).json({
      success: true,
      message: 'Payment already verified',
      data: {
        payment: {
          id: payment._id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency
        },
        enrollment: enrollment
      }
    });
  }

  // 5. Verify signature using HMAC SHA256
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const isSignatureValid = crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(razorpay_signature)
  );

  if (!isSignatureValid) {
    // Mark payment as failed
    await payment.markAsFailed('SIGNATURE_INVALID', 'Payment signature verification failed');
    return next(new ApiError(400, 'Payment verification failed: Invalid signature'));
  }

  // 6. Verify payment status with Razorpay (double verification)
  let razorpayPayment;
  try {
    razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
  } catch (error) {
    await payment.markAsFailed('FETCH_FAILED', `Failed to fetch payment: ${error.message}`);
    return next(new ApiError(500, 'Failed to verify payment with Razorpay'));
  }

  // 7. Check payment status from Razorpay
  if (razorpayPayment.status !== 'captured' && razorpayPayment.status !== 'authorized') {
    await payment.markAsFailed(
      razorpayPayment.error_code || 'PAYMENT_NOT_CAPTURED',
      razorpayPayment.error_description || `Payment status: ${razorpayPayment.status}`
    );
    return next(new ApiError(400, `Payment not successful. Status: ${razorpayPayment.status}`));
  }

  // 8. Verify amount matches
  const expectedAmountInPaise = Math.round(payment.amount * 100);
  if (razorpayPayment.amount !== expectedAmountInPaise) {
    await payment.markAsFailed('AMOUNT_MISMATCH', `Expected ${expectedAmountInPaise}, got ${razorpayPayment.amount}`);
    return next(new ApiError(400, 'Payment amount mismatch'));
  }

  // 9. Update payment record
  await payment.markAsCaptured(razorpay_payment_id, razorpay_signature);

  // 10. Create enrollment (atomic operation with check)
  let enrollment = await Enrollment.findOne({
    course: payment.course,
    learner: req.user._id
  });

  if (!enrollment) {
    enrollment = await Enrollment.create({
      course: payment.course,
      learner: req.user._id,
      status: 'yet_to_start'
    });
  }

  // 11. Populate course details for response
  await enrollment.populate('course', 'title coverImage description');

  res.status(200).json({
    success: true,
    message: 'Payment verified and enrollment completed successfully',
    data: {
      payment: {
        id: payment._id,
        status: 'captured',
        amount: payment.amount,
        currency: payment.currency,
        razorpay_payment_id: razorpay_payment_id
      },
      enrollment: {
        id: enrollment._id,
        status: enrollment.status,
        course: enrollment.course
      }
    }
  });
});

/**
 * @desc    Handle Razorpay webhook events
 * @route   POST /api/payments/webhook
 * @access  Public (Razorpay servers)
 */
export const handleWebhook = asyncHandler(async (req, res, next) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('RAZORPAY_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  // 1. Verify webhook signature
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('Webhook signature verification failed');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // 2. Process webhook event
  const event = req.body.event;
  const payload = req.body.payload;

  switch (event) {
    case 'payment.captured': {
      const paymentData = payload.payment.entity;
      const orderId = paymentData.order_id;

      const payment = await Payment.findByOrderId(orderId);
      if (payment && payment.status !== 'captured') {
        await payment.markAsCaptured(paymentData.id, ''); // No signature in webhook

        // Create enrollment if not exists
        const existingEnrollment = await Enrollment.findOne({
          course: payment.course,
          learner: payment.user
        });

        if (!existingEnrollment) {
          await Enrollment.create({
            course: payment.course,
            learner: payment.user,
            status: 'yet_to_start'
          });
        }
      }
      break;
    }

    case 'payment.failed': {
      const paymentData = payload.payment.entity;
      const orderId = paymentData.order_id;

      const payment = await Payment.findByOrderId(orderId);
      if (payment && payment.status === 'created') {
        await payment.markAsFailed(
          paymentData.error_code || 'PAYMENT_FAILED',
          paymentData.error_description || 'Payment failed'
        );
      }
      break;
    }

    case 'refund.created': {
      const refundData = payload.refund.entity;
      const paymentId = refundData.payment_id;

      const payment = await Payment.findOne({ razorpay_payment_id: paymentId });
      if (payment) {
        payment.status = 'refunded';
        payment.refundId = refundData.id;
        payment.refundedAt = new Date();
        payment.refundAmount = refundData.amount / 100; // Convert from paise
        await payment.save();

        // Remove enrollment if refunded
        await Enrollment.findOneAndDelete({
          course: payment.course,
          learner: payment.user
        });
      }
      break;
    }

    default:
      console.log(`Unhandled webhook event: ${event}`);
  }

  res.status(200).json({ received: true });
});

/**
 * @desc    Get payment status for a course
 * @route   GET /api/payments/status/:courseId
 * @access  Private (Learner)
 */
export const getPaymentStatus = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) {
    return next(new ApiError(404, 'Course not found'));
  }

  // Check if course is free
  if (course.accessRule !== 'payment' || course.price <= 0) {
    return res.status(200).json({
      success: true,
      data: {
        requiresPayment: false,
        canEnroll: true,
        message: 'This is a free course'
      }
    });
  }

  // Check for successful payment
  const successfulPayment = await Payment.findOne({
    user: req.user._id,
    course: courseId,
    status: 'captured'
  }).select('amount currency status createdAt razorpay_payment_id');

  // Check enrollment
  const enrollment = await Enrollment.findOne({
    course: courseId,
    learner: req.user._id
  });

  if (successfulPayment) {
    return res.status(200).json({
      success: true,
      data: {
        requiresPayment: true,
        hasPaid: true,
        canEnroll: true,
        isEnrolled: !!enrollment,
        payment: successfulPayment,
        message: 'Payment completed'
      }
    });
  }

  // Check for pending payment
  const pendingPayment = await Payment.findOne({
    user: req.user._id,
    course: courseId,
    status: 'created',
    createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
  }).select('razorpay_order_id amount currency status createdAt');

  res.status(200).json({
    success: true,
    data: {
      requiresPayment: true,
      hasPaid: false,
      canEnroll: false,
      isEnrolled: false,
      pendingPayment: pendingPayment || null,
      coursePrice: course.price,
      courseCurrency: course.currency,
      message: 'Payment required for enrollment'
    }
  });
});

/**
 * @desc    Get user's payment history
 * @route   GET /api/payments/history
 * @access  Private (Learner)
 */
export const getPaymentHistory = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, status } = req.query;

  const query = { user: req.user._id };
  if (status) {
    query.status = status;
  }

  const payments = await Payment.find(query)
    .populate('course', 'title coverImage price currency')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Payment.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * @desc    Get payment details by ID
 * @route   GET /api/payments/:paymentId
 * @access  Private (Learner - own payments, Admin - all)
 */
export const getPaymentById = asyncHandler(async (req, res, next) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId)
    .populate('user', 'name email')
    .populate('course', 'title coverImage price currency');

  if (!payment) {
    return next(new ApiError(404, 'Payment not found'));
  }

  // Check authorization
  if (req.user.role !== 'admin' && payment.user._id.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, 'Not authorized to view this payment'));
  }

  res.status(200).json({
    success: true,
    data: payment
  });
});

/**
 * @desc    Cancel a pending payment order
 * @route   POST /api/payments/cancel/:orderId
 * @access  Private (Learner)
 */
export const cancelOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;

  const payment = await Payment.findOne({
    razorpay_order_id: orderId,
    user: req.user._id
  });

  if (!payment) {
    return next(new ApiError(404, 'Order not found'));
  }

  if (payment.status !== 'created') {
    return next(new ApiError(400, `Cannot cancel order with status: ${payment.status}`));
  }

  payment.status = 'failed';
  payment.errorCode = 'USER_CANCELLED';
  payment.errorDescription = 'Order cancelled by user';
  await payment.save();

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully'
  });
});

/**
 * @desc    Admin: Get all payments (with filters)
 * @route   GET /api/payments/admin/all
 * @access  Private (Admin)
 */
export const getAllPayments = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    status,
    courseId,
    userId,
    startDate,
    endDate
  } = req.query;

  const query = {};

  if (status) query.status = status;
  if (courseId) query.course = courseId;
  if (userId) query.user = userId;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const payments = await Payment.find(query)
    .populate('user', 'name email')
    .populate('course', 'title price')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Payment.countDocuments(query);

  // Calculate summary stats
  const stats = await Payment.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      payments,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});
