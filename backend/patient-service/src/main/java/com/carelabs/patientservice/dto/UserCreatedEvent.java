package com.carelabs.patientservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCreatedEvent {
    private UUID userId;
    private String email;
    private String role;

    private String fullName;
    private String specialty;
    private String slmcNumber;
    private Integer experienceYears;
    private String qualification;
    private String bio;
    private BigDecimal consultationFee;
}
