package com.carelabs.authservice.controller;

import com.carelabs.authservice.dto.UserDto;
import com.carelabs.authservice.model.User;
import com.carelabs.authservice.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * INTERNAL ONLY — not exposed to the public internet through the API gateway.
 * Used by other microservices (e.g. notification-service) to resolve user emails by ID.
 *
 * In production this would be protected by network policy / mTLS.
 * For this assignment it is permitted without JWT since it's on an internal port.
 */
@RestController
@RequestMapping("/auth/internal")
public class InternalUserController {

    private final UserRepository userRepository;

    public InternalUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<UserDto> getUserById(@PathVariable UUID userId) {
        return userRepository.findById(userId)
                .map(user -> ResponseEntity.ok(UserDto.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .build()))
                .orElse(ResponseEntity.notFound().build());
    }
}