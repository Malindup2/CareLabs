package com.carelabs.aisymptomservice.controller;

import com.carelabs.aisymptomservice.dto.SymptomCheckRequest;
import com.carelabs.aisymptomservice.dto.SymptomCheckResponse;
import com.carelabs.aisymptomservice.service.SymptomCheckService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ai")
public class SymptomCheckController {

    private final SymptomCheckService symptomCheckService;

    public SymptomCheckController(SymptomCheckService symptomCheckService) {
        this.symptomCheckService = symptomCheckService;
    }

    @PreAuthorize("hasRole('PATIENT')")
    @PostMapping("/symptom-check")
    public SymptomCheckResponse symptomCheck(@Valid @RequestBody SymptomCheckRequest request) {
        return symptomCheckService.analyzeSymptoms(request.getSymptoms());
    }
}