package com.akionur.notmini.controllers;

import com.akionur.notmini.entities.User;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.akionur.notmini.repositories.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody @Valid User user) {
        User saved = userRepository.save(user);
        return ResponseEntity.ok(saved);
    }
}