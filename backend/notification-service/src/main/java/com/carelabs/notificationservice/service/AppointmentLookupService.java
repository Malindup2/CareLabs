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
                                    @Value("${app.appointment-service-url:http://localhost:8082}") String appointmentServiceUrl) {
        this.restTemplate = restTemplate;
        this.appointmentServiceUrl = appointmentServiceUrl;
    }

    public AppointmentViewDto getAppointmentById(UUID appointmentId) {
        try {
            String url = appointmentServiceUrl + "/appointments/" + appointmentId;
            return restTemplate.getForObject(url, AppointmentViewDto.class);
        } catch (Exception e) {
            log.error("Failed to lookup appointment {}: {}", appointmentId, e.getMessage());
            return null;
        }
    }
}
