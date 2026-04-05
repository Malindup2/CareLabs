package com.carelabs.doctorservice.controller;

import com.carelabs.doctorservice.entity.*;
import com.carelabs.doctorservice.enums.DocumentType;
import com.carelabs.doctorservice.enums.VerificationStatus;
import com.carelabs.doctorservice.service.DoctorService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/doctors")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @GetMapping
    public ResponseEntity<List<Doctor>> searchDoctors(@RequestParam(required = false) String specialty) {
        return ResponseEntity.ok(doctorService.searchDoctors(specialty));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Doctor> getDoctorById(@PathVariable UUID id) {
        return ResponseEntity.ok(doctorService.getDoctorById(id));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Doctor> getMyProfile(@RequestHeader("X-Auth-User-Id") UUID userId) {
        return ResponseEntity.ok(doctorService.getDoctorByUserId(userId));
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Doctor> updateMyProfile(
            @RequestHeader("X-Auth-User-Id") UUID userId, 
            @RequestBody Doctor doctorDetails) {
        return ResponseEntity.ok(doctorService.updateMyProfile(userId, doctorDetails));
    }

    @PostMapping(value = "/documents", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<DoctorDocument> uploadDocument(
            @RequestHeader("X-Auth-User-Id") UUID userId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") DocumentType type) {
        return ResponseEntity.ok(doctorService.uploadDocument(userId, file, type));
    }

    @GetMapping("/documents")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<DoctorDocument>> getMyDocuments(@RequestHeader("X-Auth-User-Id") UUID userId) {
        return ResponseEntity.ok(doctorService.getMyDocuments(userId));
    }

    @DeleteMapping("/documents/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Void> deleteDocument(@RequestHeader("X-Auth-User-Id") UUID userId, @PathVariable UUID id) {
        doctorService.deleteDocument(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/availability")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Availability> setAvailability(@RequestHeader("X-Auth-User-Id") UUID userId, @RequestBody Availability availability) {
        return ResponseEntity.ok(doctorService.addAvailability(userId, availability));
    }

    @DeleteMapping("/availability/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Void> removeAvailability(@RequestHeader("X-Auth-User-Id") UUID userId, @PathVariable UUID id) {
        doctorService.removeAvailability(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/leave")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<DoctorLeave> addLeave(@RequestHeader("X-Auth-User-Id") UUID userId, @RequestBody DoctorLeave leave) {
        return ResponseEntity.ok(doctorService.addLeave(userId, leave));
    }

    @PutMapping("/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Doctor> verifyDoctor(@PathVariable UUID id, @RequestParam VerificationStatus status) {
        return ResponseEntity.ok(doctorService.verifyDoctor(id, status));
    }
}
