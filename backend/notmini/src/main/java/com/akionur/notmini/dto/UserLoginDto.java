package com.akionur.notmini.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserLoginDto {
    private String email;
    private String password;
}