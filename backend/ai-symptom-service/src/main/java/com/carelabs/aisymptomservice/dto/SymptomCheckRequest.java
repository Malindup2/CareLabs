package com.carelabs.aisymptomservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SymptomCheckRequest {

    @NotBlank(message = "Symptoms are required")
    private String symptoms;
}