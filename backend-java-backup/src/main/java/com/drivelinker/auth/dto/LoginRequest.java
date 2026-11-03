package com.drivelinker.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO nhận dữ liệu đăng nhập từ người dùng (username, password).
 */
public class LoginRequest {
    @NotBlank(message = "Company Code is required")
    private String companyCode;

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;

    public String getCompanyCode() {
        return companyCode;
    }

    public void setCompanyCode(String companyCode) {
        this.companyCode = companyCode;
    }

    public String getUsername(){
        return username;
    }

    public void setUsername(String username){
        this.username = username;
    }

    public String getPassword(){
        return password;
    }

    public void setPassword(String password){
        this.password = password;
    }
}
