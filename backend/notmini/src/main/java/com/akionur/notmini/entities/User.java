package com.akionur.notmini.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotEmpty
    @Column(unique = true)
    private String username;

    @Email
    @NotEmpty
    @Column(unique = true)
    private String email;

    @NotEmpty
    private String password;

    private String pphex;

    private String bannerhex_1;

    private String bannerhex_2;

    private Integer hangmanScore = 0;

    private Integer memoryMatchCountdownScore = 0;

    private Integer memoryMatchTimeChallengeScore = 0;

    private Integer tictactoeScore = 0;

    private Integer headOrTailScore = 0;

    private Integer f1ReactionScore = 0;
}