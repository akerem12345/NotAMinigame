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

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;
    // Register
    @PostMapping("/register")
    public ResponseEntity<UserLightDto> register(@RequestBody @Valid User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            return ResponseEntity.status(409).build();
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User saved = userRepository.save(user);
        return ResponseEntity.ok(new UserLightDto(saved.getId(), saved.getUsername(), saved.getEmail()));
    }

    // Login
    @PostMapping("/login")
    public ResponseEntity<java.util.Map<String, String>> login(@RequestBody @Valid UserLoginDto dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı"));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).build();
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
                user.getPphex(), user.getBannerhex_1(), user.getBannerhex_2()
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
                user.getPphex(), user.getBannerhex_1(), user.getBannerhex_2()
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
                saved.getPphex(), saved.getBannerhex_1(), saved.getBannerhex_2()
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
}