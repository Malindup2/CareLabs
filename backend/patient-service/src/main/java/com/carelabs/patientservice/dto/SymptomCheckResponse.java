package com.carelabs.patientservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SymptomCheckResponse {
    private UUID id;
    private String symptoms;
    private String result;
    private String recommendedSpecialty;
    private Double confidenceScore;
}