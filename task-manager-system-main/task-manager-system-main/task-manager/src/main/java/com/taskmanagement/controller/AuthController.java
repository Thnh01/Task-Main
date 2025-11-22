package com.taskmanagement.controller;

import com.taskmanagement.config.AuthService;
import com.taskmanagement.dto.request.LoginRequest;
import com.taskmanagement.dto.response.LoginResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<LoginResponse> response = authService.authenticate(request);
        
        if (response.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid username or password, or account is inactive");
        }

        return ResponseEntity.ok(response.get());
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // For now, logout is handled on the client side by clearing localStorage
        // If using JWT tokens in the future, we would invalidate the token here
        return ResponseEntity.ok().body("Logged out successfully");
    }
}
