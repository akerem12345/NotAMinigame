package com.akionur.notmini.services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendPasswordResetEmail(String to, String username, String resetToken) {
        try {
            // Read HTML template
            ClassPathResource resource = new ClassPathResource("templates/password-reset.html");
            String htmlTemplate = StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);

            // Replace placeholders
            String resetLink = "http://localhost:5173/reset-password?token=" + resetToken;
            String htmlContent = htmlTemplate
                    .replace("{{USERNAME}}", username)
                    .replace("{{RESET_LINK}}", resetLink);

            // Create MimeMessage
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("NotAMinigame Şifre Sıfırlama Talebi");
            helper.setText(htmlContent, true);

            mailSender.send(message);

        } catch (MessagingException | IOException e) {
            System.err.println("Failed to send email: " + e.getMessage());
            throw new RuntimeException("E-posta gönderimi başarısız oldu.");
        }
    }
}
