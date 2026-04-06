package com.carelabs.patientservice.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class CurrentUserService {

    public UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getPrincipal() == null) {
            throw new RuntimeException("No authenticated user found");
        }

        return UUID.fromString(authentication.getPrincipal().toString());
    }

    public String getCurrentRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getAuthorities() == null || authentication.getAuthorities().isEmpty()) {
            throw new RuntimeException("No authenticated role found");
        }

        return authentication.getAuthorities().iterator().next().getAuthority();
    }
}