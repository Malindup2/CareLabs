package com.carelabs.authservice.service;

import com.carelabs.authservice.dto.UserDto;
import com.carelabs.authservice.exception.ResourceNotFoundException;
import com.carelabs.authservice.exception.ResourceConflictException;
import com.carelabs.authservice.model.Role;
import com.carelabs.authservice.model.User;
import com.carelabs.authservice.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    private final UserRepository userRepository;

    public AdminUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public UserDto updateUserRole(UUID userId, Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setRole(role);
        return convertToDto(userRepository.save(user));
    }

    public void deleteUser(UUID userId) {
        userRepository.deleteById(userId);
    }

    public UserDto verifyDoctor(UUID doctorId) {
        User user = userRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        if (user.getRole() != Role.DOCTOR) {
            throw new ResourceConflictException("Only doctors can be verified in this endpoint");
        }
        
        user.setVerified(true);
        return convertToDto(userRepository.save(user));
    }

    private UserDto convertToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .isVerified(user.isVerified())
                .build();
    }
}
