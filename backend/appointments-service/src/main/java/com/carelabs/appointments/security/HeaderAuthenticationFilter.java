package com.carelabs.appointments.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class HeaderAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String userId = request.getHeader("X-Auth-User-Id");
        String role = request.getHeader("X-Auth-Role");

        if (userId != null && !userId.isEmpty() && role != null && !role.isBlank()) {
            System.out.println("[APP-SEC] Found headers - UserID: " + userId + " | Role: " + role);
            try {
                // Validate that userId is a valid UUID format before setting authentication
                java.util.UUID.fromString(userId);
                
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userId, null, Collections.singletonList(authority));
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (IllegalArgumentException e) {
                System.err.println("[APP-SEC] Invalid UUID in X-Auth-User-Id: " + userId);
            }
        } else {
            System.err.println("[APP-SEC] Missing/Empty Auth Headers downstream. UserID: " + userId + " | Role: " + role);
        }

        chain.doFilter(request, response);
    }
}
