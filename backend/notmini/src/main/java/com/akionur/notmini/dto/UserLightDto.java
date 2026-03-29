package com.akionur.notmini.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserLightDto {
    private Long id;
    private String username;
    private String email;
}