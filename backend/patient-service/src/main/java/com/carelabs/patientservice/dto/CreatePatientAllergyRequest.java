package com.carelabs.patientservice.dto;

import com.carelabs.patientservice.enums.AllergySeverity;
import com.carelabs.patientservice.enums.AllergyType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePatientAllergyRequest {

    @NotBlank(message = "Allergen is required")
    private String allergen;

    @NotNull(message = "Allergy type is required")
    private AllergyType type;

    @NotNull(message = "Allergy severity is required")
    private AllergySeverity severity;

    private String reaction;
}