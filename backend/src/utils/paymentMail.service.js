import nodemailer from 'nodemailer';

const escapeHtml = (value = '') => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const createTransporter = () => {
  // Log which env vars are present/missing
  console.log('[Mail] EMAIL_USER:', process.env.EMAIL_USER ? '✓ set' : '✗ MISSING');
  console.log('[Mail] EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓ set' : '✗ MISSING');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('[Mail] Transporter not created: EMAIL_USER or EMAIL_PASS is missing from env');
    return null;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD.replace(/\s/g, '')
    }
  });

  return transporter;
};

export const sendPaymentSuccessEmail = async ({
  to,
  name,
  courseTitle,
  amount,
  currency,
  razorpayPaymentId,
  orderId,
  paidAt = new Date()
}) => {
  console.log('[Mail] sendPaymentSuccessEmail called, recipient:', to);

  if (!to) {
    console.error('[Mail] Aborted: recipient email address is missing');
    return { sent: false, reason: 'MISSING_RECIPIENT' };
  }

  const transporter = createTransporter();

  if (!transporter) {
    console.error('[Mail] Aborted: transporter is null (check EMAIL_USER / EMAIL_PASS in .env)');
    return { sent: false, reason: 'EMAIL_NOT_CONFIGURED' };
  }

  // Verify SMTP connection before attempting to send
  try {
    await transporter.verify();
    console.log('[Mail] SMTP connection verified successfully');
  } catch (verifyError) {
    console.error('[Mail] SMTP connection failed:', verifyError.message);
    // Common causes:
    // - Wrong password / App Password not used (Gmail requires App Passwords when 2FA is on)
    // - "Less secure app access" disabled
    // - Typo in EMAIL_USER
    return { sent: false, reason: 'SMTP_VERIFY_FAILED', error: verifyError.message };
  }

  const safeName = escapeHtml(name || 'Learner');
  const safeCourseTitle = escapeHtml(courseTitle || 'Your course');
  const safeCurrency = escapeHtml(currency || 'INR');
  const safePaymentId = escapeHtml(razorpayPaymentId || 'N/A');
  const safeOrderId = escapeHtml(orderId || 'N/A');
  const formattedAmount = Number(amount || 0).toFixed(2);
  const paidOn = new Date(paidAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  try {
    const info = await transporter.sendMail({
      from: `"Learnova" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Payment Successful - ${safeCourseTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
          <h2 style="color: #15803d;">Payment Successful</h2>
          <p>Hi ${safeName},</p>
          <p>Your payment has been received successfully. You are now enrolled in your course.</p>

          <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 18px 0;">
            <p style="margin: 0 0 8px;"><strong>Course:</strong> ${safeCourseTitle}</p>
            <p style="margin: 0 0 8px;"><strong>Amount Paid:</strong> ${safeCurrency} ${formattedAmount}</p>
            <p style="margin: 0 0 8px;"><strong>Payment ID:</strong> ${safePaymentId}</p>
            <p style="margin: 0 0 8px;"><strong>Order ID:</strong> ${safeOrderId}</p>
            <p style="margin: 0;"><strong>Paid On:</strong> ${escapeHtml(paidOn)}</p>
          </div>

          <p style="margin-bottom: 4px;">You can now continue learning from your dashboard.</p>
          <p style="color: #6b7280; font-size: 13px; margin-top: 20px;">
            This is an automated payment confirmation email from Learnova.
          </p>
        </div>
      `
    });

    console.log('[Mail] Email sent successfully. MessageId:', info.messageId);
    return { sent: true, messageId: info.messageId };

  } catch (sendError) {
    console.error('[Mail] sendMail failed:', sendError.message);
    console.error('[Mail] Full error:', sendError);
    return { sent: false, reason: 'SEND_FAILED', error: sendError.message };
  }
};