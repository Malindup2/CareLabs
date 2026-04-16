package com.carelabs.notificationservice.service;

import com.carelabs.notificationservice.dto.PatientProfileDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@Service
@Slf4j
public class PatientLookupService {

    private final RestTemplate restTemplate;
    private final String patientServiceUrl;

    public PatientLookupService(RestTemplate restTemplate, 
                                @Value("${services.patient-url:http://localhost:8082}") String patientServiceUrl) {
        this.restTemplate = restTemplate;
        this.patientServiceUrl = patientServiceUrl;
    }

    public PatientProfileDto getPatientByUserId(UUID userId) {
        try {
            String url = patientServiceUrl + "/patients/internal/" + userId;
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Auth-User-Id", "00000000-0000-0000-0000-000000000000"); // Internal system ID
            headers.set("X-Auth-Role", "ADMIN");
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<PatientProfileDto> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, PatientProfileDto.class);
            
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to lookup patient profile for userId {}: {}", userId, e.getMessage());
            return null;
        }
    }
}
