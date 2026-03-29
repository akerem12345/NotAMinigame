package com.akionur.notmini.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;

@Getter
@Setter
@Entity
@Table(name = "scores")
public class Score {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @NotEmpty
    private String game;

    private Integer score;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;
}