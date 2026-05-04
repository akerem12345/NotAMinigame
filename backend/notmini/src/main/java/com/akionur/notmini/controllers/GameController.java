package com.akionur.notmini.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/games")
@CrossOrigin(origins = "*", maxAge = 3600)
public class GameController {

    private static final List<String> HANGMAN_WORDS = Arrays.asList(
            "ALGORITHM", "APPLICATION", "BANDWIDTH", "BROWSER", "BYTE", 
            "CACHE", "COMPILER", "DATABASE", "DEBUG", "ENCRYPTION",
            "FIREWALL", "HARDWARE", "INTERFACE", "JAVASCRIPT", "KERNEL", 
            "LATENCY", "MALWARE", "NETWORK", "OPERATING", "PACKET",
            "PROTOCOL", "QUERY", "ROUTER", "SERVER", "SOFTWARE",
            "TERMINAL", "VARIABLE", "VIRTUAL", "WEBSITE", "WIRELESS",
            "FRAMEWORK", "FRONTEND", "BACKEND", "AUTHENTICATION", "AUTHORIZATION"
    );

    @GetMapping("/hangman/word")
    public ResponseEntity<?> getRandomHangmanWord() {
        Random random = new Random();
        String word = HANGMAN_WORDS.get(random.nextInt(HANGMAN_WORDS.size()));
        return ResponseEntity.ok(Map.of("word", word));
    }
}
