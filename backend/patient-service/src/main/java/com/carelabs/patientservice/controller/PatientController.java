package com.carelabs.patientservice.controller;

import com.carelabs.patientservice.dto.MedicalHistoryResponse;
import com.carelabs.patientservice.dto.MedicalReportResponse;
import com.carelabs.patientservice.dto.PatientProfileResponse;
import com.carelabs.patientservice.dto.UpdatePatientProfileRequest;
import com.carelabs.patientservice.service.PatientService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/patients")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    // TEMP: using hardcoded userId for now
    private UUID getCurrentUserId() {
        return UUID.fromString("11111111-1111-1111-1111-111111111111");
    }

    @GetMapping("/me")
    public PatientProfileResponse getMyProfile() {
        return patientService.getMyProfile(getCurrentUserId());
    }

    @PutMapping("/me")
    public PatientProfileResponse updateMyProfile(@RequestBody UpdatePatientProfileRequest request) {
        return patientService.updateMyProfile(getCurrentUserId(), request);
    }

    @GetMapping("/reports")
    public List<MedicalReportResponse> getMyReports() {
        return patientService.getMyReports(getCurrentUserId());
    }

    @GetMapping("/medical-history")
    public MedicalHistoryResponse getMedicalHistory() {
        return patientService.getMedicalHistory(getCurrentUserId());
    }
}