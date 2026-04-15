package com.carelabs.appointments.service;

import com.carelabs.appointments.dto.DoctorAvailabilityView;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class DoctorScheduleLookupService {

    private final RestTemplate restTemplate;

    @Value("${integration.doctor-service.base-url:http://doctor-service:8083}")
    private String doctorServiceBaseUrl;

    public DoctorScheduleLookupService() {
        this.restTemplate = new RestTemplate();
    }

    public List<DoctorAvailabilityView> getDoctorAvailability(UUID doctorId) {
        try {
            DoctorAvailabilityView[] rows = restTemplate.getForObject(
                    doctorServiceBaseUrl + "/doctors/" + doctorId + "/availability",
                    DoctorAvailabilityView[].class
            );
            if (rows == null) {
                return Collections.emptyList();
            }
            return Arrays.asList(rows);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public UUID getDoctorIdByUserId(UUID userId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Auth-User-Id", userId.toString());
            headers.set("X-Auth-Role", "DOCTOR");

            ResponseEntity<Map> response = restTemplate.exchange(
                    doctorServiceBaseUrl + "/doctors/me",
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class
            );

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return null;
            }

            Object doctorId = response.getBody().get("id");
            if (doctorId == null) {
                return null;
            }

            return UUID.fromString(String.valueOf(doctorId));
        } catch (Exception e) {
            return null;
        }
    }
}
