package com.akionur.notmini.controllers;

import com.akionur.notmini.dto.ScoreRequestDto;
import com.akionur.notmini.entities.Score;
import com.akionur.notmini.services.ScoreService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/scores")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ScoreController {

    @Autowired
    private ScoreService scoreService;

    @PostMapping
    public ResponseEntity<?> submitScore(@Valid @RequestBody ScoreRequestDto requestDto) {
        try {
            Score savedScore = scoreService.saveScore(requestDto);
            return ResponseEntity.ok(savedScore);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error saving score: " + e.getMessage());
        }
    }
}
