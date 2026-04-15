package com.carelabs.notificationservice.service;

import com.carelabs.notificationservice.dto.UserEmailDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

/**
 * Calls the auth-service internal endpoint to look up a user's email address by their UUID.
 *
 * Endpoint called: GET {auth-service}/auth/internal/users/{userId}
 * This is a new internal endpoint added to auth-service (see InternalUserController.java).
 * It is NOT protected by JWT — it is accessible only from within the internal network.
 */
@Service
@Slf4j
public class UserLookupService {

    private final RestTemplate restTemplate;

    @Value("${services.auth-url}")
    private String authServiceUrl;

    public UserLookupService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Returns the email of the given user, or null if the lookup fails.
     * We return null (not throw) so the notification service can still save
     * the notification record even if the email lookup temporarily fails.
     */
    public UserEmailDto getUserById(UUID userId) {
        String url = authServiceUrl + "/auth/internal/users/" + userId;
        try {
            UserEmailDto dto = restTemplate.getForObject(url, UserEmailDto.class);
            if (dto == null) {
                log.warn("Auth service returned null for userId={}", userId);
            }
            return dto;
        } catch (RestClientException e) {
            log.error("Failed to fetch user email from auth-service for userId={}: {}", userId, e.getMessage());
            return null;
        }
    }

    public java.util.List<UserEmailDto> getAllUsers() {
        String url = authServiceUrl + "/auth/internal/users";
        try {
            UserEmailDto[] dtoList = restTemplate.getForObject(url, UserEmailDto[].class);
            return dtoList != null ? java.util.Arrays.asList(dtoList) : java.util.Collections.emptyList();
        } catch (RestClientException e) {
            log.error("Failed to fetch all users from auth-service: {}", e.getMessage());
            return java.util.Collections.emptyList();
        }
    }
}