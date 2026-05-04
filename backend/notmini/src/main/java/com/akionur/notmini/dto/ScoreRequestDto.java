package com.akionur.notmini.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class ScoreRequestDto {

    @NotEmpty(message = "Game type cannot be empty")
    private String gameType;

    @NotNull(message = "Score cannot be null")
    private Integer score;

    private Map<String, Object> metadata;
}
