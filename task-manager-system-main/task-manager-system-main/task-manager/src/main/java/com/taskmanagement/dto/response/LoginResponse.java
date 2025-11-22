package com.taskmanagement.dto.response;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class LoginResponse {
    private String token;
    private UserDTO user;
}

