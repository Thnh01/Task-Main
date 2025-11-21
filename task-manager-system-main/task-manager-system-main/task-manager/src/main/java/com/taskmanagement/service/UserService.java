package com.taskmanagement.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taskmanagement.dto.CreateUserRequest;
import com.taskmanagement.dto.UpdateUserRequest;
import com.taskmanagement.dto.UserDTO;
import com.taskmanagement.entity.User;
import com.taskmanagement.repository.UserRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepo userRepository;
    private final PasswordEncoder passwordEncoder;
    private static final String[] DEFAULT_COLORS = {
            "#5B8DEF", "#5ECFB1", "#F5A864", "#F56565", "#9F7AEA", "#48BB78"
    };

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<UserDTO> getUserById(Integer id) {
        return userRepository.findById(id).map(this::convertToDTO);
    }

    @Transactional
    public UserDTO createUser(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setRole(User.UserRole.valueOf(request.getRole()));
        user.setStatus(User.UserStatus.ACTIVE);
        user.setAvatarColor(resolveAvatarColor(request.getAvatarColor()));

        User saved = userRepository.save(user);
        return convertToDTO(saved);
    }

    @Transactional
    public Optional<UserDTO> updateUser(Integer id, UpdateUserRequest request) {
        return userRepository.findById(id)
                .map(user -> {
                    if (request.getFullName() != null) user.setFullName(request.getFullName());
                    if (request.getEmail() != null) user.setEmail(request.getEmail());
                    if (request.getRole() != null) user.setRole(User.UserRole.valueOf(request.getRole()));
                    if (request.getStatus() != null) user.setStatus(User.UserStatus.valueOf(request.getStatus()));
                    if (request.getAvatarColor() != null) user.setAvatarColor(request.getAvatarColor());
                    if (request.getPassword() != null && !request.getPassword().isEmpty()) {
                        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
                    }
                    return convertToDTO(userRepository.save(user));
                });
    }

    @Transactional
    public boolean deactivateUser(Integer id) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setStatus(User.UserStatus.INACTIVE);
                    userRepository.save(user);
                    return true;
                })
                .orElse(false);
    }

    @Transactional
    public Optional<UserDTO> activateUser(Integer id) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setStatus(User.UserStatus.ACTIVE);
                    return convertToDTO(userRepository.save(user));
                });
    }

    private UserDTO convertToDTO(User user) {
        return UserDTO.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().toString())
                .status(user.getStatus().toString())
                .avatarColor(user.getAvatarColor())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private String resolveAvatarColor(String providedColor) {
        if (providedColor != null && !providedColor.isBlank()) {
            return providedColor;
        }
        int index = (int) (Math.random() * DEFAULT_COLORS.length);
        return DEFAULT_COLORS[index];
    }
}