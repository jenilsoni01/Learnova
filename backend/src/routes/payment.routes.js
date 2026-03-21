/**
 * Payment Routes
 *
 * Handles all payment-related API endpoints for Razorpay integration
 */

import { Router } from 'express';
import {
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentStatus,
  getPaymentHistory,
  getPaymentById,
  cancelOrder,
  getAllPayments
} from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

// ==================== PUBLIC ROUTES ====================

// Razorpay webhook (must be before auth middleware)
// Note: Webhook verification is handled in the controller
router.post('/webhook', handleWebhook);

// ==================== LEARNER ROUTES ====================

// Create a new payment order
router.post('/create-order', protect, authorize('learner'), createOrder);

// Verify payment after Razorpay checkout
router.post('/verify', protect, authorize('learner'), verifyPayment);

// Get payment status for a specific course
router.get('/status/:courseId', protect, authorize('learner'), getPaymentStatus);

// Get user's payment history
router.get('/history', protect, authorize('learner'), getPaymentHistory);

// Get specific payment details
router.get('/:paymentId', protect, getPaymentById);

// Cancel a pending order
router.post('/cancel/:orderId', protect, authorize('learner'), cancelOrder);

// ==================== ADMIN ROUTES ====================

// Get all payments (admin only)
router.get('/admin/all', protect, authorize('admin'), getAllPayments);

export default router;
