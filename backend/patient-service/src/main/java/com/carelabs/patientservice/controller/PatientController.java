package com.carelabs.patientservice.controller;

import com.carelabs.patientservice.dto.CreatePatientAllergyRequest;
import com.carelabs.patientservice.dto.MedicalHistoryResponse;
import com.carelabs.patientservice.dto.MedicalReportResponse;
import com.carelabs.patientservice.dto.PatientAllergyResponse;
import com.carelabs.patientservice.dto.PatientProfileResponse;
import com.carelabs.patientservice.dto.UpdatePatientAllergyRequest;
import com.carelabs.patientservice.dto.UpdatePatientProfileRequest;
import com.carelabs.patientservice.enums.ReportType;
import com.carelabs.patientservice.service.CurrentUserService;
import com.carelabs.patientservice.service.PatientService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/patients")
public class PatientController {

    private final PatientService patientService;
    private final CurrentUserService currentUserService;

    public PatientController(PatientService patientService, CurrentUserService currentUserService) {
        this.patientService = patientService;
        this.currentUserService = currentUserService;
    }

    @PreAuthorize("hasRole('PATIENT')")
    @GetMapping("/me")
    public PatientProfileResponse getMyProfile() {
        UUID userId = currentUserService.getCurrentUserId();
        return patientService.getMyProfile(userId);
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    @GetMapping("/internal/{userId}")
    public PatientProfileResponse getPatientProfile(@PathVariable UUID userId) {
        return patientService.getMyProfile(userId);
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PutMapping("/me")
    public PatientProfileResponse updateMyProfile(@Valid @RequestBody UpdatePatientProfileRequest request) {
        UUID userId = currentUserService.getCurrentUserId();
        return patientService.updateMyProfile(userId, request);
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PostMapping(value = "/reports", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MedicalReportResponse uploadReport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") ReportType type,
            @RequestParam(value = "appointmentId", required = false) UUID appointmentId
    ) {
        UUID userId = currentUserService.getCurrentUserId();
        return patientService.uploadReport(userId, file, type, appointmentId);
    }

    @PreAuthorize("hasRole('PATIENT')")
    @GetMapping("/reports")
    public List<MedicalReportResponse> getMyReports() {
        UUID userId = currentUserService.getCurrentUserId();
        return patientService.getMyReports(userId);
    }

    @PreAuthorize("hasRole('PATIENT')")
    @GetMapping("/reports/{id}")
    public MedicalReportResponse getMyReportById(@PathVariable UUID id) {
        UUID userId = currentUserService.getCurrentUserId();
        return patientService.getMyReportById(userId, id);
    }

    @PreAuthorize("hasRole('PATIENT')")
    @DeleteMapping("/reports/{id}")
    public void deleteMyReport(@PathVariable UUID id) {
        UUID userId = currentUserService.getCurrentUserId();
        patientService.deleteMyReport(userId, id);
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PostMapping("/allergies")
    public PatientAllergyResponse createMyAllergy(@Valid @RequestBody CreatePatientAllergyRequest request) {
        UUID userId = currentUserService.getCurrentUserId();
        return patientService.createMyAllergy(userId, request);
    }

    @PreAuthorize("hasRole('PATIENT')")
    @GetMapping("/allergies")
    public List<PatientAllergyResponse> getMyAllergies() {
        UUID userId = currentUserService.getCurrentUserId();
        return patientService.getMyAllergies(userId);
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PutMapping("/allergies/{id}")
    public PatientAllergyResponse updateMyAllergy(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePatientAllergyRequest request
    ) {
        UUID userId = currentUserService.getCurrentUserId();
        return patientService.updateMyAllergy(userId, id, request);
    }

    @PreAuthorize("hasRole('PATIENT')")
    @DeleteMapping("/allergies/{id}")
    public void deleteMyAllergy(@PathVariable UUID id) {
        UUID userId = currentUserService.getCurrentUserId();
        patientService.deleteMyAllergy(userId, id);
    }

    @PreAuthorize("hasRole('PATIENT')")
    @GetMapping("/medical-history")
    public MedicalHistoryResponse getMedicalHistory() {
        UUID userId = currentUserService.getCurrentUserId();
        return patientService.getMedicalHistory(userId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<PatientProfileResponse> getAllPatients() {
        return patientService.getAllPatients();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/{id}")
    public void deletePatientForAdmin(@PathVariable UUID id) {
        patientService.deletePatient(id);
    }
}