package com.carelabs.patientservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalHistoryResponse {
    private PatientProfileResponse profile;
    private List<PatientAllergyResponse> allergies;
    private List<MedicalReportResponse> reports;
    
}