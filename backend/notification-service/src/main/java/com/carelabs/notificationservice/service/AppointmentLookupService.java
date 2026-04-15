package com.carelabs.notificationservice.service;

import com.carelabs.notificationservice.dto.AppointmentViewDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@Service
@Slf4j
public class AppointmentLookupService {

    private final RestTemplate restTemplate;
    private final String appointmentServiceUrl;

    public AppointmentLookupService(RestTemplate restTemplate, 
                                    @Value("${services.appointment-url:http://localhost:8084}") String appointmentServiceUrl) {
        this.restTemplate = restTemplate;
        this.appointmentServiceUrl = appointmentServiceUrl;
    }

    public AppointmentViewDto getAppointmentById(UUID appointmentId) {
        try {
            String url = appointmentServiceUrl + "/appointments/" + appointmentId;
            
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("X-Auth-User-Id", "00000000-0000-0000-0000-000000000000");
            headers.set("X-Auth-Role", "ADMIN");
            org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);

            org.springframework.http.ResponseEntity<AppointmentViewDto> response = restTemplate.exchange(
                    url, org.springframework.http.HttpMethod.GET, entity, AppointmentViewDto.class);
            
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to lookup appointment {}: {}", appointmentId, e.getMessage());
            return null;
        }
    }
}
