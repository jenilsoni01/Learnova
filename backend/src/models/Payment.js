import mongoose from 'mongoose';

/**
 * Payment Model
 *
 * Stores all payment transactions for courses.
 * Separate collection for:
 * - Better query performance for payment history
 * - Transaction audit trail
 * - Easy refund handling
 * - Analytics and reporting
 */
const paymentSchema = new mongoose.Schema({
  // User making the payment
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Course being purchased
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },

  // Payment amount details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true
  },

  // Razorpay specific fields
  razorpay_order_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  razorpay_payment_id: {
    type: String,
    sparse: true,  // Allow null but unique when present
    index: true
  },
  razorpay_signature: {
    type: String
  },

  // Payment status lifecycle
  status: {
    type: String,
    enum: ['created', 'attempted', 'captured', 'failed', 'refunded'],
    default: 'created',
    index: true
  },

  // Additional metadata
  receipt: {
    type: String,
    unique: true
  },

  // Error details if payment failed
  errorCode: { type: String },
  errorDescription: { type: String },

  // Refund details if applicable
  refundId: { type: String },
  refundedAt: { type: Date },
  refundAmount: { type: Number },
  refundReason: { type: String },

  // Verification timestamp
  verifiedAt: { type: Date },

  // IP and user agent for fraud detection
  ipAddress: { type: String },
  userAgent: { type: String }

}, { timestamps: true });

// Compound index for checking if user has paid for a course
paymentSchema.index({ user: 1, course: 1, status: 1 });

// Index for finding pending payments
paymentSchema.index({ status: 1, createdAt: 1 });

// Static method: Check if user has successful payment for course
paymentSchema.statics.hasUserPaidForCourse = async function(userId, courseId) {
  const payment = await this.findOne({
    user: userId,
    course: courseId,
    status: 'captured'
  });
  return !!payment;
};

// Static method: Get payment by order ID
paymentSchema.statics.findByOrderId = function(orderId) {
  return this.findOne({ razorpay_order_id: orderId });
};

// Static method: Get user's payment history
paymentSchema.statics.getUserPayments = function(userId) {
  return this.find({ user: userId })
    .populate('course', 'title coverImage price')
    .sort('-createdAt');
};

// Instance method: Mark as captured (successful)
paymentSchema.methods.markAsCaptured = function(paymentId, signature) {
  this.razorpay_payment_id = paymentId;
  this.razorpay_signature = signature;
  this.status = 'captured';
  this.verifiedAt = new Date();
  return this.save();
};

// Instance method: Mark as failed
paymentSchema.methods.markAsFailed = function(errorCode, errorDescription) {
  this.status = 'failed';
  this.errorCode = errorCode;
  this.errorDescription = errorDescription;
  return this.save();
};

export default mongoose.model('Payment', paymentSchema);
