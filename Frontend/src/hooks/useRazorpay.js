import { useState, useCallback } from 'react';
import api from '../api/axios';

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

export const useRazorpay = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const initiatePayment = useCallback(async (courseId, courseTitle, userInfo, onSuccess, onError) => {
    setLoading(true);
    setError(null);

    try {
      // Call enrollment endpoint which handles order creation for paid courses
      const response = await api.post(`/enrollments/${courseId}`);
      const data = response.data;

      // If already enrolled or free course
      if (data.enrolled) {
        onSuccess({ enrolled: true, message: data.message });
        setLoading(false);
        return;
      }

      // If payment is required
      if (data.requiresPayment && data.order) {
        const { order, key } = data;

        const options = {
          key: key || RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: 'Learnova',
          description: `Enrollment: ${courseTitle}`,
          order_id: order.id,
          handler: async (paymentResult) => {
            try {
              // Verify payment with backend
              const verifyResponse = await api.post(`/enrollments/${courseId}/verify-payment`, {
                razorpay_order_id: paymentResult.razorpay_order_id,
                razorpay_payment_id: paymentResult.razorpay_payment_id,
                razorpay_signature: paymentResult.razorpay_signature,
              });

              if (verifyResponse.data.success) {
                onSuccess({
                  enrolled: true,
                  message: 'Payment successful! You are now enrolled.',
                  enrollment: verifyResponse.data.enrollment,
                });
              } else {
                onError(verifyResponse.data.message || 'Payment verification failed');
              }
            } catch (err) {
              onError(err.response?.data?.message || 'Payment verification failed');
            }
          },
          prefill: {
            name: userInfo?.name || '',
            email: userInfo?.email || '',
            contact: userInfo?.phone || '',
          },
          notes: {
            courseId: courseId,
          },
          theme: {
            color: '#6366f1',
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
              onError('Payment cancelled');
            },
          },
        };

        const razorpay = new window.Razorpay(options);

        razorpay.on('payment.failed', (response) => {
          setLoading(false);
          onError(response.error.description || 'Payment failed');
        });

        razorpay.open();
      }
    } catch (err) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'Failed to initiate payment';
      setError(errorMessage);
      onError(errorMessage);
    }
  }, []);

  return {
    initiatePayment,
    loading,
    error,
  };
};

export default useRazorpay;
