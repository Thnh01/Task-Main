package com.taskmanagement.config;

import com.taskmanagement.dto.request.LoginRequest;
import com.taskmanagement.dto.response.LoginResponse;
import com.taskmanagement.dto.response.UserDTO;
import com.taskmanagement.entity.User;
import com.taskmanagement.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepo userRepository;
    private final PasswordEncoder passwordEncoder;

    public Optional<LoginResponse> authenticate(LoginRequest request) {
        // Find user by username
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());
        
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        User user = userOpt.get();

        // Check if account is active
        if (user.getStatus() != User.UserStatus.ACTIVE) {
            return Optional.empty();
        }

        // Verify password - password is required
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            return Optional.empty();
        }

        // Verify password using PasswordEncoder
        boolean passwordValid = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());
        
        if (!passwordValid) {
            return Optional.empty();
        }

        // Convert User to UserDTO
        UserDTO userDTO = UserDTO.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .avatarColor(user.getAvatarColor())
                .createdAt(user.getCreatedAt())
                .build();

        // Create LoginResponse (for now, token is empty string as we're not using JWT)
        LoginResponse response = LoginResponse.builder()
                .token("") // No JWT token for now
                .user(userDTO)
                .build();

        return Optional.of(response);
    }
}
