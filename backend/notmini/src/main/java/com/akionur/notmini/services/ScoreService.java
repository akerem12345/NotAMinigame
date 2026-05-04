package com.akionur.notmini.services;

import com.akionur.notmini.dto.ScoreRequestDto;
import com.akionur.notmini.entities.Score;
import com.akionur.notmini.entities.User;
import com.akionur.notmini.repositories.ScoreRepository;
import com.akionur.notmini.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class ScoreService {

    @Autowired
    private ScoreRepository scoreRepository;

    @Autowired
    private UserRepository userRepository;

    public Score saveScore(ScoreRequestDto requestDto) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElse(null);

        Score score = new Score();
        score.setUser(user); // Can be null if guest, depending on logic.
        score.setGame(requestDto.getGameType());
        score.setScore(requestDto.getScore());
        score.setMetadata(requestDto.getMetadata());

        return scoreRepository.save(score);
    }
}
