package com.carelabs.doctorservice.controller;

import com.carelabs.doctorservice.service.DoctorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/doctors/public")
public class PublicStatsController {

    private final DoctorService doctorService;

    public PublicStatsController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getPublicStats() {
        long totalVerified = doctorService.getAllDoctorsForAdmin().stream()
                .filter(d -> com.carelabs.doctorservice.enums.VerificationStatus.APPROVED.equals(d.getVerificationStatus()))
                .count();

        long totalSpecialties = doctorService.getAllDoctorsForAdmin().stream()
                .map(d -> d.getSpecialty())
                .filter(s -> s != null && !s.isEmpty())
                .distinct()
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalVerifiedDoctors", totalVerified);
        stats.put("totalSpecialties", totalSpecialties);
        // For patients, since we are in doctor-service, we can't easily get it without inter-service call.
        // We'll use a conservative estimate or just stick to doctors for now to keep it 100% real.
        stats.put("status", "OPERATIONAL");

        return ResponseEntity.ok(stats);
    }
}
