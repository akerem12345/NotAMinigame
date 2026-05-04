package com.akionur.notmini.repositories;

import com.akionur.notmini.entities.Score;
import com.akionur.notmini.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScoreRepository extends JpaRepository<Score, Long> {
    List<Score> findByUserOrderByScoreDesc(User user);
    List<Score> findByGameOrderByScoreDesc(String game);
}
