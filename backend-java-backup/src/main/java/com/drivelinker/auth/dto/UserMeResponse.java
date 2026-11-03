package com.drivelinker.auth.dto;

/**
 * DTO chứa thông tin chi tiết của người dùng đang đăng nhập (phục vụ API /api/auth/me).
 * Được lập trình thủ công 100%, không sử dụng annotation tự sinh.
 */
public class UserMeResponse {
    private Integer userId;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private Integer organizationId;
    private String companyCode;
    private String organizationName;
    private String status;

    public UserMeResponse() {
    }

    public UserMeResponse(Integer userId, String username, String fullName, String email, String phone,
                          String role, Integer organizationId, String companyCode, String organizationName,
                          String status) {
        this.userId = userId;
        this.username = username;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.role = role;
        this.organizationId = organizationId;
        this.companyCode = companyCode;
        this.organizationName = organizationName;
        this.status = status;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Integer getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(Integer organizationId) {
        this.organizationId = organizationId;
    }

    public String getCompanyCode() {
        return companyCode;
    }

    public void setCompanyCode(String companyCode) {
        this.companyCode = companyCode;
    }

    public String getOrganizationName() {
        return organizationName;
    }

    public void setOrganizationName(String organizationName) {
        this.organizationName = organizationName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

