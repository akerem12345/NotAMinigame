package com.akionur.notmini.controllers;

import com.akionur.notmini.dto.UserLightDto;
import com.akionur.notmini.dto.UserLoginDto;
import com.akionur.notmini.dto.UserProfileDto;
import com.akionur.notmini.entities.User;
import com.akionur.notmini.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.akionur.notmini.repositories.UserRepository;
import com.akionur.notmini.repositories.PasswordResetTokenRepository;
import com.akionur.notmini.entities.PasswordResetToken;
import com.akionur.notmini.services.EmailService;
import java.util.Date;
import java.util.UUID;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private EmailService emailService;

    // Register
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            return ResponseEntity.status(409).body(java.util.Map.of("message", "Bu e-posta adresi zaten kullanımda."));
        }
        if (userRepository.existsByUsername(user.getUsername())) {
            return ResponseEntity.status(409).body(java.util.Map.of("message", "Bu kullanıcı adı zaten alınmış. Lütfen başka belirleyin."));
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User saved = userRepository.save(user);
        return ResponseEntity.ok(new UserLightDto(saved.getId(), saved.getUsername(), saved.getEmail()));
    }

    // Login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid UserLoginDto dto) {
        User user = userRepository.findByEmail(dto.getEmail()).orElse(null);

        if (user == null || !passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body(java.util.Map.of("message", "E-posta veya şifre hatalı."));
        }

        String token = jwtUtil.generateToken(user.getEmail());
        return ResponseEntity.ok(java.util.Map.of("token", token));
    }

    // Get all users (light)
    @GetMapping
    public ResponseEntity<java.util.List<UserLightDto>> getAllUsers() {
        java.util.List<UserLightDto> users = userRepository.findAll().stream()
                .map(u -> new UserLightDto(u.getId(), u.getUsername(), u.getEmail()))
                .toList();
        return ResponseEntity.ok(users);
    }

    // Get current profile
    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> getCurrentProfile(java.security.Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        UserProfileDto dto = new UserProfileDto(
                user.getId(), user.getUsername(), user.getEmail(),
                user.getPphex(), user.getBannerhex_1(), user.getBannerhex_2(),
                user.getHangmanScore(), user.getMemoryMatchCountdownScore(), user.getMemoryMatchTimeChallengeScore(), user.getTictactoeScore(), user.getHeadOrTailScore(), user.getF1ReactionScore()
        );
        return ResponseEntity.ok(dto);
    }

    // Get profile by id
    @GetMapping("/{id}")
    public ResponseEntity<UserProfileDto> getProfile(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        UserProfileDto dto = new UserProfileDto(
                user.getId(), user.getUsername(), user.getEmail(),
                user.getPphex(), user.getBannerhex_1(), user.getBannerhex_2(),
                user.getHangmanScore(), user.getMemoryMatchCountdownScore(), user.getMemoryMatchTimeChallengeScore(), user.getTictactoeScore(), user.getHeadOrTailScore(), user.getF1ReactionScore()
        );
        return ResponseEntity.ok(dto);
    }

    // Update profile
    @PatchMapping("/{id}")
    public ResponseEntity<UserProfileDto> updateProfile(@PathVariable Long id, @RequestBody UserProfileDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        if (dto.getUsername() != null) user.setUsername(dto.getUsername());
        if (dto.getEmail() != null) user.setEmail(dto.getEmail());
        if (dto.getPphex() != null) user.setPphex(dto.getPphex());
        if (dto.getBannerhex_1() != null) user.setBannerhex_1(dto.getBannerhex_1());
        if (dto.getBannerhex_2() != null) user.setBannerhex_2(dto.getBannerhex_2());

        User saved = userRepository.save(user);
        UserProfileDto response = new UserProfileDto(
                saved.getId(), saved.getUsername(), saved.getEmail(),
                saved.getPphex(), saved.getBannerhex_1(), saved.getBannerhex_2(),
                saved.getHangmanScore(), saved.getMemoryMatchCountdownScore(), saved.getMemoryMatchTimeChallengeScore(), saved.getTictactoeScore(), saved.getHeadOrTailScore(), saved.getF1ReactionScore()
        );
        return ResponseEntity.ok(response);
    }

    // Delete user
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Forgot Password
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody @Valid com.akionur.notmini.dto.ForgotPasswordDto dto) {
        String email = dto.getEmail();
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            
            // Delete previous tokens for this user
            tokenRepository.deleteByUser(user);

            // Generate new token
            String token = UUID.randomUUID().toString();
            Date expiryDate = new Date(System.currentTimeMillis() + 1000 * 60 * 20); // 20 minutes
            
            PasswordResetToken resetToken = new PasswordResetToken(token, user, expiryDate);
            tokenRepository.save(resetToken);

            // Send Email
            emailService.sendPasswordResetEmail(user.getEmail(), user.getUsername(), token);

            return ResponseEntity.ok(java.util.Map.of("message", "Şifre sıfırlama e-postası gönderildi."));
        } else {
            // Do not reveal if email exists or not for security reasons, just return ok
            return ResponseEntity.ok(java.util.Map.of("message", "Eğer e-posta sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderilmiştir."));
        }
    }

    // Reset Password
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody @Valid com.akionur.notmini.dto.ResetPasswordDto dto) {
        String token = dto.getToken();
        String newPassword = dto.getNewPassword();

        Optional<PasswordResetToken> tokenOptional = tokenRepository.findByToken(token);

        if (tokenOptional.isEmpty()) {
            // Fırlatalım Exception ki GlobalExceptionHandler yakalasın veya direkt manuel dönelim
            throw new RuntimeException("Geçersiz veya süresi dolmuş token.");
        }

        PasswordResetToken resetToken = tokenOptional.get();

        if (resetToken.getExpiryDate().before(new Date())) {
            tokenRepository.delete(resetToken);
            throw new RuntimeException("Token süresi dolmuş.");
        }

        // Update password
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Discard token
        tokenRepository.delete(resetToken);

        return ResponseEntity.ok(java.util.Map.of("message", "Şifreniz başarıyla güncellendi."));
    }
}