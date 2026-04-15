package com.carelabs.notificationservice.service;

import com.carelabs.notificationservice.dto.UserEmailDto;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@Service
@Slf4j
public class DoctorLookupService {

    private final RestTemplate restTemplate;
    private final String doctorServiceUrl;

    public DoctorLookupService(RestTemplate restTemplate,
                               @Value("${services.doctor-url:http://localhost:8083}") String doctorServiceUrl) {
        this.restTemplate = restTemplate;
        this.doctorServiceUrl = doctorServiceUrl;
    }

    public DoctorProfileDto getDoctorById(UUID doctorId) {
        try {
            String url = doctorServiceUrl + "/doctors/" + doctorId;

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("X-Auth-User-Id", "00000000-0000-0000-0000-000000000000");
            headers.set("X-Auth-Role", "ADMIN");
            org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);

            org.springframework.http.ResponseEntity<DoctorProfileDto> response = restTemplate.exchange(
                    url, org.springframework.http.HttpMethod.GET, entity, DoctorProfileDto.class);

            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to lookup doctor {}: {}", doctorId, e.getMessage());
            return null;
        }
    }

    @Data
    public static class DoctorProfileDto {
        private UUID id;
        private UUID userId;
        private String fullName;
    }
}
