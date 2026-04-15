package com.carelabs.notificationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Represents the response from the auth-service internal endpoint:
 * GET /auth/internal/users/{userId}
 *
 * Only the fields we need for email dispatch.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserEmailDto {
    private UUID id;
    private String email;
    private String role;
    private String fullName;
}