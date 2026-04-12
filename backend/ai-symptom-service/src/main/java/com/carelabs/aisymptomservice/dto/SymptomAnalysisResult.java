package com.carelabs.aisymptomservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SymptomAnalysisResult {
    private String result;
    private Double confidenceScore;
    private String recommendedSpecialty;
    private boolean symptomQuery;
}