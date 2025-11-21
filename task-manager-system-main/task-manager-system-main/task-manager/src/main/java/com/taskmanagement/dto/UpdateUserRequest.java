package com.taskmanagement.dto;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String fullName;
    private String email;
    private String password;  // Optional - only update if provided
    private String role;
    private String status;
    private String avatarColor;
}