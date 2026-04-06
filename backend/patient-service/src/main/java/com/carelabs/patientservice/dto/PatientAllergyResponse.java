package com.carelabs.patientservice.dto;

import com.carelabs.patientservice.enums.AllergySeverity;
import com.carelabs.patientservice.enums.AllergyType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientAllergyResponse {
    private UUID id;
    private String allergen;
    private AllergyType type;
    private AllergySeverity severity;
    private String reaction;
}