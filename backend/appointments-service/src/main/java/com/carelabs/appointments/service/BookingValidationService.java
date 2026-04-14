package com.carelabs.appointments.service;

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
public class BookingValidationService {

    private final RestTemplate restTemplate;

    @Value("${integration.patient-service.base-url:http://patient-service:8082}")
    private String patientServiceBaseUrl;

    @Value("${integration.doctor-service.base-url:http://doctor-service:8083}")
    private String doctorServiceBaseUrl;

    public BookingValidationService() {
        this.restTemplate = new RestTemplate();
    }

    public void validatePatientExistsAndActive(UUID patientId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Auth-User-Id", patientId.toString());
        headers.set("X-Auth-Role", "PATIENT");

        try {
            restTemplate.exchange(
                    patientServiceBaseUrl + "/patients/me",
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class
            );
        } catch (Exception e) {
            throw new RuntimeException("Patient profile not found or inaccessible");
        }
    }

    public void validateDoctorExistsAndVerified(UUID doctorId) {
        try {
            Map<?, ?> doctorPayload = restTemplate.getForObject(doctorServiceBaseUrl + "/doctors/" + doctorId, Map.class);
            if (doctorPayload == null) {
                throw new RuntimeException("Doctor not found");
            }

            Object active = doctorPayload.get("active");
            Object verificationStatus = doctorPayload.get("verificationStatus");

            boolean isActive = active instanceof Boolean && (Boolean) active;
            boolean isApproved = verificationStatus != null
                    && "APPROVED".equalsIgnoreCase(String.valueOf(verificationStatus));

            if (!isActive || !isApproved) {
                throw new RuntimeException("Doctor is not active/verified for appointments");
            }
        } catch (RuntimeException ex) {
            throw ex;
        } catch (Exception e) {
            throw new RuntimeException("Doctor validation failed");
        }
    }

    public String getPatientFullName(UUID patientId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Auth-User-Id", patientId.toString());
            headers.set("X-Auth-Role", "DOCTOR");

            ResponseEntity<Map> response = restTemplate.exchange(
                    patientServiceBaseUrl + "/patients/internal/" + patientId,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class
            );
            Map<?, ?> body = response.getBody();
            if (body != null && body.get("fullName") != null) {
                return String.valueOf(body.get("fullName"));
            }
        } catch (Exception e) {
            // Named lookup failed - fallback to Unknown Patient
        }
        return "Unknown Patient";
    }
}