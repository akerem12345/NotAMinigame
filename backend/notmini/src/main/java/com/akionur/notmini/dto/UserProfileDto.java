package com.akionur.notmini.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private Long id;
    private String username;
    private String email;
    private String pphex;
    private String bannerhex_1;
    private String bannerhex_2;
    private Integer hangmanScore;
    private Integer memoryMatchCountdownScore;
    private Integer memoryMatchTimeChallengeScore;
    private Integer tictactoeScore;
}