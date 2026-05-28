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

        Score savedScore = scoreRepository.save(score);

        if (user != null) {
            String game = requestDto.getGameType();
            int points = requestDto.getScore() != null ? requestDto.getScore() : 0;
            if ("HANGMAN".equalsIgnoreCase(game)) {
                user.setHangmanScore((user.getHangmanScore() == null ? 0 : user.getHangmanScore()) + points);
            } else if ("MEMORY".equalsIgnoreCase(game)) {
                String mode = requestDto.getMetadata() != null ? (String) requestDto.getMetadata().get("gameMode") : null;
                if ("countdown".equals(mode)) {
                    user.setMemoryMatchCountdownScore((user.getMemoryMatchCountdownScore() == null ? 0 : user.getMemoryMatchCountdownScore()) + points);
                } else if ("timeChallenge".equals(mode)) {
                    user.setMemoryMatchTimeChallengeScore((user.getMemoryMatchTimeChallengeScore() == null ? 0 : user.getMemoryMatchTimeChallengeScore()) + points);
                }
            } else if ("TIC_TAC_TOE".equalsIgnoreCase(game)) {
                user.setTictactoeScore((user.getTictactoeScore() == null ? 0 : user.getTictactoeScore()) + points);
            } else if ("HEAD_OR_TAIL".equalsIgnoreCase(game)) {
                user.setHeadOrTailScore((user.getHeadOrTailScore() == null ? 0 : user.getHeadOrTailScore()) + points);
            } else if ("F1_REACTION".equalsIgnoreCase(game)) {
                user.setF1ReactionScore((user.getF1ReactionScore() == null ? 0 : user.getF1ReactionScore()) + points);
            }
            userRepository.save(user);
        }

        return savedScore;
    }
}
