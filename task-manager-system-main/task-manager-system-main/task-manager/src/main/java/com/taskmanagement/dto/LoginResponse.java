package com.taskmanagement.dto;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class LoginResponse {
    private String token;
    private String username;
    private String fullName;
    private String role;
    private String email;
}
