package com.carelabs.authservice.service;

import com.carelabs.authservice.dto.AuthResponse;
import com.carelabs.authservice.dto.ChangePasswordRequest;
import com.carelabs.authservice.dto.LoginRequest;
import com.carelabs.authservice.dto.RefreshTokenRequest;
import com.carelabs.authservice.dto.RegisterRequest;
import com.carelabs.authservice.dto.UserDto;
import com.carelabs.authservice.model.User;
import com.carelabs.authservice.repository.UserRepository;
import com.carelabs.authservice.security.JwtUtil;
import com.carelabs.authservice.exception.ResourceConflictException;
import com.carelabs.authservice.exception.ResourceNotFoundException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    public AuthService(UserRepository userRepository, 
                       PasswordEncoder passwordEncoder, 
                       JwtUtil jwtUtil, 
                       AuthenticationManager authenticationManager, 
                       UserDetailsService userDetailsService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceConflictException("Email already exists");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();

        userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails, user.getRole().name(), user.getId().toString());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        
        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                .orElse("PATIENT");

                User user = userRepository.findByEmail(userDetails.getUsername())
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                user.setLastLoginAt(LocalDateTime.now());
                userRepository.save(user);

        String token = jwtUtil.generateToken(userDetails, role, user.getId().toString());

        return AuthResponse.builder()
                .token(token)
                .email(userDetails.getUsername())
                .role(role)
                .build();
    }

        public AuthResponse refreshToken(RefreshTokenRequest request) {
                String email;
                try {
                        email = jwtUtil.extractUsernameAllowExpired(request.getToken());
                } catch (Exception ex) {
                        throw new ResourceConflictException("Invalid refresh token");
                }

                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                if (Boolean.FALSE.equals(user.getEnabled())) {
                        throw new ResourceConflictException("User account is disabled");
                }

                String token = jwtUtil.generateToken(email, user.getRole().name(), user.getId().toString());
                return AuthResponse.builder()
                                .token(token)
                                .email(user.getEmail())
                                .role(user.getRole().name())
                                .build();
        }

        public void changePassword(String email, ChangePasswordRequest request) {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                        throw new ResourceConflictException("Current password is incorrect");
                }

                if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
                        throw new ResourceConflictException("New password must be different from current password");
                }

                user.setPassword(passwordEncoder.encode(request.getNewPassword()));
                userRepository.save(user);
        }

    public UserDto getCurrentUserInfo(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .enabled(user.getEnabled())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
