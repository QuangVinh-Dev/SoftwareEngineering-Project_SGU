package com.HoiAn.HA_App.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@hoianheritage.vn}")
    private String fromEmail;

    @Value("${app.mail.store-owner-url:http://localhost:5175}")
    private String storeOwnerUrl;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Autowired
    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Gửi email thông báo hồ sơ gian hàng đã được phê duyệt
     */
    public void sendMerchantApprovedEmail(String toEmail, String merchantName) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Không thể gửi email phê duyệt gian hàng: Email trống cho merchant '{}'", merchantName);
            return;
        }

        String safeMerchantName = (merchantName != null && !merchantName.isBlank()) ? merchantName : "Đối tác";
        String subject = "[Hội An Heritage] Chúc mừng! Hồ sơ gian hàng của bạn đã được phê duyệt";
        String htmlContent = buildApprovalHtml(safeMerchantName, toEmail);

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    /**
     * Gửi email thông báo hồ sơ gian hàng bị từ chối
     */
    public void sendMerchantRejectedEmail(String toEmail, String merchantName, String reason) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Không thể gửi email từ chối gian hàng: Email trống cho merchant '{}'", merchantName);
            return;
        }

        String safeMerchantName = (merchantName != null && !merchantName.isBlank()) ? merchantName : "Đối tác";
        String safeReason = (reason != null && !reason.isBlank()) 
                ? reason 
                : "Thông tin hồ sơ hoặc giấy tờ chưa đầy đủ theo quy định của nền tảng.";
        String subject = "[Hội An Heritage] Thông báo kết quả xét duyệt hồ sơ gian hàng";
        String htmlContent = buildRejectionHtml(safeMerchantName, safeReason);

        sendHtmlEmail(toEmail, subject, htmlContent);
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        if (mailSender == null || mailUsername == null || mailUsername.isBlank()) {
            log.info("[MÔ PHỎNG EMAIL] Chưa cấu hình SMTP username (SPRING_MAIL_USERNAME trống). " +
                    "Hệ thống mô phỏng gửi thành công -> Gửi đến: {} | Tiêu đề: {}", to, subject);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

            helper.setFrom(fromEmail, "Hội An Heritage");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Đã gửi email thành công tới: {} | Tiêu đề: {}", to, subject);
        } catch (Exception e) {
            log.error("Không thể gửi email tới {}: {}", to, e.getMessage(), e);
        }
    }

    private String buildApprovalHtml(String merchantName, String email) {
        String loginUrl = storeOwnerUrl + "/login";
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Hồ sơ gian hàng được phê duyệt</title>
              <style>
                body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
                .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
                .header { background: linear-gradient(135deg, #2e1065 0%%, #7c3aed 100%%); padding: 36px 32px; text-align: center; color: #ffffff; }
                .header h1 { margin: 0 0 8px; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
                .header p { margin: 0; font-size: 14px; color: #ddd6fe; }
                .badge { display: inline-block; padding: 6px 14px; background-color: #ecfdf5; color: #047857; font-size: 13px; font-weight: 700; border-radius: 9999px; margin-top: 14px; border: 1px solid #a7f3d0; }
                .content { padding: 32px; }
                .content h2 { margin-top: 0; font-size: 18px; color: #0f172a; font-weight: 700; }
                .content p { font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 16px; }
                .info-box { background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 18px; margin: 20px 0; }
                .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
                .info-row:last-child { margin-bottom: 0; }
                .info-label { color: #6b21a8; font-weight: 600; }
                .info-value { color: #1e1b4b; font-weight: 700; }
                .steps { margin: 24px 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.8; }
                .cta-wrapper { text-align: center; margin: 32px 0 16px; }
                .cta-btn { display: inline-block; background-color: #7c3aed; color: #ffffff !important; text-decoration: none; padding: 14px 32px; font-size: 15px; font-weight: 700; border-radius: 10px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35); }
                .footer { background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Hội An Heritage</h1>
                  <p>Hệ thống Thuyết minh & Quản lý Điểm tham quan Di sản</p>
                  <div class="badge">✓ HỒ SƠ ĐÃ ĐƯỢC PHÊ DUYỆT</div>
                </div>
                <div class="content">
                  <h2>Kính gửi Quý đối tác, %s!</h2>
                  <p>Ban Quản trị <strong>Hội An Heritage</strong> xin trân trọng thông báo: Hồ sơ đăng ký gian hàng của bạn đã được xét duyệt thành công.</p>
                  
                  <div class="info-box">
                    <div class="info-row">
                      <span class="info-label">Tên gian hàng:</span>
                      <span class="info-value">%s</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Tài khoản đăng nhập:</span>
                      <span class="info-value">%s</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Trạng thái:</span>
                      <span class="info-value" style="color: #059669;">Hoạt động chính thức</span>
                    </div>
                  </div>

                  <p><strong>Bước tiếp theo để đón khách:</strong></p>
                  <ol class="steps">
                    <li>Đăng nhập vào <strong>Cổng Quản lý Gian hàng</strong>.</li>
                    <li>Thiết lập hồ sơ điểm tham quan (POI) của gian hàng (định vị GPS / toạ độ, hình ảnh trưng bày).</li>
                    <li>Đăng tải file audio thuyết minh để du khách có thể nghe khi đến gần gian hàng.</li>
                    <li>Theo dõi số lượt nghe và tương tác của du khách theo thời gian thực trên trang Tổng quan.</li>
                  </ol>

                  <div class="cta-wrapper">
                    <a href="%s" target="_blank" class="cta-btn">Truy cập Cổng Quản lý Gian hàng &rarr;</a>
                  </div>
                </div>
                <div class="footer">
                  <p>Email này được gửi tự động từ Nền tảng Hội An Heritage. Vui lòng không trả lời trực tiếp email này.</p>
                  <p>&copy; 2026 Hội An Heritage Platform. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(merchantName, merchantName, email, loginUrl);
    }

    private String buildRejectionHtml(String merchantName, String reason) {
        String loginUrl = storeOwnerUrl + "/login";
        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Thông báo kết quả duyệt hồ sơ gian hàng</title>
              <style>
                body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
                .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
                .header { background: linear-gradient(135deg, #1e293b 0%%, #475569 100%%); padding: 36px 32px; text-align: center; color: #ffffff; }
                .header h1 { margin: 0 0 8px; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
                .header p { margin: 0; font-size: 14px; color: #cbd5e1; }
                .badge { display: inline-block; padding: 6px 14px; background-color: #fef2f2; color: #dc2626; font-size: 13px; font-weight: 700; border-radius: 9999px; margin-top: 14px; border: 1px solid #fecaca; }
                .content { padding: 32px; }
                .content h2 { margin-top: 0; font-size: 18px; color: #0f172a; font-weight: 700; }
                .content p { font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 16px; }
                .reason-box { background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 0 12px 12px 0; padding: 18px; margin: 20px 0; }
                .reason-label { font-size: 13px; font-weight: 700; color: #991b1b; text-transform: uppercase; margin-bottom: 6px; }
                .reason-text { font-size: 15px; font-weight: 600; color: #7f1d1d; line-height: 1.5; margin: 0; }
                .cta-wrapper { text-align: center; margin: 32px 0 16px; }
                .cta-btn { display: inline-block; background-color: #475569; color: #ffffff !important; text-decoration: none; padding: 14px 32px; font-size: 15px; font-weight: 700; border-radius: 10px; }
                .footer { background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Hội An Heritage</h1>
                  <p>Hệ thống Thuyết minh & Quản lý Điểm tham quan Di sản</p>
                  <div class="badge">✕ CHƯA ĐƯỢC PHÊ DUYỆT</div>
                </div>
                <div class="content">
                  <h2>Kính gửi Quý đối tác, %s!</h2>
                  <p>Cảm ơn bạn đã quan tâm và gửi hồ sơ đăng ký tham gia mạng lưới gian hàng thông minh trên nền tảng <strong>Hội An Heritage</strong>.</p>
                  <p>Sau khi xem xét hồ sơ, Ban Quản trị rất tiếc thông báo rằng hồ sơ của bạn chưa đủ điều kiện phê duyệt tại thời điểm này.</p>
                  
                  <div class="reason-box">
                    <div class="reason-label">Lý do từ chối từ Ban Quản trị:</div>
                    <p class="reason-text">%s</p>
                  </div>

                  <p>Bạn có thể đăng nhập vào cổng thông tin để kiểm tra chi tiết trạng thái, bổ sung thông tin hoặc liên hệ đội ngũ hỗ trợ của chúng tôi để được giải đáp cụ thể.</p>

                  <div class="cta-wrapper">
                    <a href="%s" target="_blank" class="cta-btn">Kiểm tra thông tin tài khoản &rarr;</a>
                  </div>
                </div>
                <div class="footer">
                  <p>Email này được gửi tự động từ Nền tảng Hội An Heritage. Vui lòng không trả lời trực tiếp email này.</p>
                  <p>&copy; 2026 Hội An Heritage Platform. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(merchantName, reason, loginUrl);
    }
}
