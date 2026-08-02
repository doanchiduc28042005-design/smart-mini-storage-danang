/**
 * EmailJS Service for sending shipper notification emails
 * SPA Approach: HTML Templates are generated directly within JS
 */

import emailjs from '@emailjs/browser';

// ============ REPLACE THESE WITH YOUR EMAILJS CREDENTIALS ============
const EMAILJS_SERVICE_ID = 'service_sggjbk5';
const EMAILJS_TEMPLATE_APPROVAL = 'template_5wjogpj'; 
const EMAILJS_TEMPLATE_REJECTION = 'template_3i9p7lj'; 
const EMAILJS_PUBLIC_KEY = 'r-S0Sjfnd2vqq8hil';
// =====================================================================

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

/**
 * Send approval email to shipper with their code and setup link
 */
export const sendShipperApprovalEmail = async (toEmail, shipperCode, setupLink) => {
  // Soạn template HTML trực tiếp bằng Template Literals
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
      <h2 style="color: #2e6c80; text-align: center;">Smart Mini Storage</h2>
      <hr style="border: none; border-top: 1px solid #eee; margin-bottom: 20px;">
      <p>Chào bạn,</p>
      <p>Chúc mừng bạn đã chính thức trở thành đối tác giao hàng (Shipper) của <strong>Smart Mini Storage</strong>!</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; border: 1px dashed #ccc;">
        <p style="margin: 0; font-size: 16px;">Mã Shipper của bạn là:</p>
        <strong style="font-size: 24px; color: #d9534f; display: block; margin-top: 5px;">${shipperCode}</strong>
      </div>

      <p>Để bắt đầu nhận đơn, vui lòng truy cập đường link bên dưới để thiết lập mật khẩu đăng nhập:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${setupLink}" style="display: inline-block; padding: 12px 25px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Thiết lập mật khẩu</a>
      </div>
      
      <p style="color: #777; font-size: 14px;">Nếu gặp khó khăn trong quá trình cài đặt, hãy phản hồi lại email này nhé.</p>
      <p style="margin-top: 30px;">Trân trọng,<br><strong>Đội ngũ Smart Mini Storage</strong></p>
    </div>
  `;

  try {
    const result = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_APPROVAL, {
      to_email: toEmail,
      subject: 'Kết quả đăng ký đối tác giao hàng Smart Mini Storage',
      message: htmlContent, // Truyền thẳng cục HTML lên EmailJS
    });
    console.log('Approval email sent successfully:', result);
    return { success: true, result };
  } catch (error) {
    console.error('Failed to send approval email:', error);
    return { success: false, error };
  }
};

export const sendShipperForgotPasswordEmail = async (toEmail, shipperCode, setupLink) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
      <h2 style="color: #2e6c80; text-align: center;">Smart Mini Storage</h2>
      <hr style="border: none; border-top: 1px solid #eee; margin-bottom: 20px;">
      <p>Chào bạn,</p>
      <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu tài khoản Shipper của bạn tại <strong>Smart Mini Storage</strong>.</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; border: 1px dashed #ccc;">
        <p style="margin: 0; font-size: 16px;">Mã Shipper của bạn là:</p>
        <strong style="font-size: 24px; color: #d9534f; display: block; margin-top: 5px;">${shipperCode}</strong>
      </div>

      <p>Vui lòng nhấp vào nút bên dưới để thiết lập lại mật khẩu mới:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${setupLink}" style="display: inline-block; padding: 12px 25px; background-color: #d9534f; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Khôi phục mật khẩu</a>
      </div>
      
      <p style="color: #777; font-size: 14px;">Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.</p>
      <p style="margin-top: 30px;">Trân trọng,<br><strong>Đội ngũ Smart Mini Storage</strong></p>
    </div>
  `;

  try {
    const result = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_APPROVAL, {
      to_email: toEmail,
      subject: 'Yêu cầu khôi phục mật khẩu Shipper Smart Mini Storage',
      message: htmlContent,
    });
    console.log('Forgot password email sent successfully:', result);
    return { success: true, result };
  } catch (error) {
    console.error('Failed to send forgot password email:', error);
    return { success: false, error };
  }
};

/**
 * Send rejection email to shipper with reason
 */
export const sendShipperRejectionEmail = async (toEmail, reason) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
      <h2 style="color: #2e6c80; text-align: center;">Smart Mini Storage</h2>
      <hr style="border: none; border-top: 1px solid #eee; margin-bottom: 20px;">
      <p>Chào bạn,</p>
      <p>Cảm ơn bạn đã quan tâm và đăng ký làm đối tác giao hàng tại <strong>Smart Mini Storage</strong>.</p>
      
      <p>Chúng tôi đã xem xét kỹ hồ sơ của bạn, nhưng rất tiếc phải thông báo rằng hồ sơ hiện tại chưa phù hợp để thông qua vào lúc này.</p>
      
      <div style="border-left: 4px solid #d9534f; background-color: #fdf5f5; padding: 15px; margin: 20px 0; color: #555;">
        <p style="margin: 0;"><strong>Lý do từ chối:</strong><br>${reason}</p>
      </div>

      <p>Hy vọng sẽ có cơ hội hợp tác với bạn trong các đợt tuyển dụng tương lai. Nếu có thắc mắc, bạn có thể phản hồi trực tiếp qua email này.</p>
      
      <p style="margin-top: 30px;">Trân trọng,<br><strong>Đội ngũ Smart Mini Storage</strong></p>
    </div>
  `;

  try {
    const result = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_REJECTION, {
      to_email: toEmail,
      subject: 'Kết quả đăng ký đối tác giao hàng Smart Mini Storage',
      message: htmlContent, 
    });
    console.log('Rejection email sent successfully:', result);
    return { success: true, result };
  } catch (error) {
    console.error('Failed to send rejection email:', error);
    return { success: false, error };
  }
};