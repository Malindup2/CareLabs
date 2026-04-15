package com.carelabs.paymentservice.service;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class PaymentValidationService {

    private final RestTemplate restTemplate;

    @Value("${integration.appointments-service.base-url:http://localhost:8084}")
    private String appointmentsServiceBaseUrl;

    public PaymentValidationService() {
        this.restTemplate = new RestTemplate();
    }

    public BigDecimal validateAndResolveAppointmentFee(UUID appointmentId) {
        Map<?, ?> appointment = loadAppointment(appointmentId);

        String status = String.valueOf(appointment.get("status"));
        if ("CANCELLED".equalsIgnoreCase(status) || "REJECTED".equalsIgnoreCase(status)) {
            throw new RuntimeException("Cannot initiate payment for cancelled/rejected appointment");
        }

        UUID patientId = UUID.fromString(String.valueOf(appointment.get("patientId")));
        enforcePatientOwnership(patientId);

        Object feeObj = appointment.get("consultationFee");
        if (feeObj == null) {
            return null;
        }
        return new BigDecimal(String.valueOf(feeObj));
    }

    private Map<?, ?> loadAppointment(UUID appointmentId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Auth-User-Id", "00000000-0000-0000-0000-000000000001");
            headers.set("X-Auth-Role", "ADMIN");

            ResponseEntity<Map> response = restTemplate.exchange(
                    appointmentsServiceBaseUrl + "/appointments/" + appointmentId,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class
            );

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new RuntimeException("Appointment not found");
            }
            return response.getBody();
        } catch (RuntimeException ex) {
            throw ex;
        } catch (Exception e) {
            throw new RuntimeException("Failed to validate appointment");
        }
    }

    private void enforcePatientOwnership(UUID appointmentPatientId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new RuntimeException("Unauthorized payment attempt");
        }

        boolean isPatient = authentication.getAuthorities().stream()
                .anyMatch(auth -> "ROLE_PATIENT".equals(auth.getAuthority()));

        if (!isPatient) {
            return;
        }

        UUID requesterId = UUID.fromString(String.valueOf(authentication.getPrincipal()));
        if (!requesterId.equals(appointmentPatientId)) {
            throw new RuntimeException("Patients can only pay for their own appointments");
        }
    }
}