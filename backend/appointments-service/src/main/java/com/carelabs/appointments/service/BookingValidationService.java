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

    @Value("${integration.auth-service.base-url:http://auth-service:8081}")
    private String authServiceBaseUrl;

    @Value("${integration.patient-service.base-url:http://patient-service:8082}")
    private String patientServiceBaseUrl;

    @Value("${integration.doctor-service.base-url:http://doctor-service:8083}")
    private String doctorServiceBaseUrl;

    public BookingValidationService() {
        this.restTemplate = new RestTemplate();
    }

    public void validatePatientExistsAndActive(UUID patientId) {
        validateUserRecord(patientId, "PATIENT");

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

            UUID doctorUserId = UUID.fromString(String.valueOf(doctorPayload.get("userId")));
            validateUserRecord(doctorUserId, "DOCTOR");
        } catch (RuntimeException ex) {
            throw ex;
        } catch (Exception e) {
            throw new RuntimeException("Doctor validation failed");
        }
    }

    private void validateUserRecord(UUID userId, String expectedRole) {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(
                    authServiceBaseUrl + "/auth/internal/users/" + userId,
                    Map.class
            );

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new RuntimeException("User not found");
            }

            Map<?, ?> payload = response.getBody();
            Object role = payload.get("role");
            Object enabled = payload.get("enabled");

            boolean roleMatches = role != null && expectedRole.equalsIgnoreCase(String.valueOf(role));
            boolean isEnabled = !(enabled instanceof Boolean) || (Boolean) enabled;

            if (!roleMatches || !isEnabled) {
                throw new RuntimeException("User role/active status invalid");
            }
        } catch (RuntimeException ex) {
            throw ex;
        } catch (Exception e) {
            throw new RuntimeException("User validation failed");
        }
    }
}