package com.akionur.notmini.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordDto {

    @NotBlank(message = "Token boş bırakılamaz.")
    private String token;

    @NotBlank(message = "Yeni şifre alanı boş bırakılamaz.")
    @Size(min = 3, max = 20, message = "Şifre en az 3, en fazla 20 karakter uzunluğunda olmalıdır.")
    private String newPassword;

}
