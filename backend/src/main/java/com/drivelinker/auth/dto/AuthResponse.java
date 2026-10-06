package com.drivelinker.auth.dto;

public class AuthResponse {
     private String token;
    private String username;
    private String role;
    private Integer organizationId;

    public AuthResponse( String token, String username, String role, Integer organizationId){
        this.token = token;
        this.username = username;
        this.role = role;
        this.organizationId= organizationId;
    }

    public String getToken (){
        return token;
    }
    public String getUsername(){
        return username;
    }
    public String getRole(){
        return role;
    }
    public Integer getOrganizationId(){
        return organizationId;
    }
}
