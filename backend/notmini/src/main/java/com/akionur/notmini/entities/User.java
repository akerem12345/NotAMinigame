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
    private String username;

    @Email
    @NotEmpty
    private String email;

    @NotEmpty
    private String password;

    private String pphex;

    private String bannerhex;
}