package com.carelabs.notificationservice.service;

import com.carelabs.notificationservice.dto.PaymentLookupDto;
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
public class PaymentLookupService {

    private final RestTemplate restTemplate;
    private final String paymentServiceUrl;

    public PaymentLookupService(RestTemplate restTemplate, 
                                @Value("${services.payment-url:http://localhost:8085}") String paymentServiceUrl) {
        this.restTemplate = restTemplate;
        this.paymentServiceUrl = paymentServiceUrl;
    }

    public PaymentLookupDto getPaymentByAppointmentId(UUID appointmentId) {
        try {
            // Updated to use the correct internal endpoint for lookup by appointment ID
            String url = paymentServiceUrl + "/payments/appointment/" + appointmentId;
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Auth-User-Id", "00000000-0000-0000-0000-000000000000");
            headers.set("X-Auth-Role", "ADMIN");
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<PaymentLookupDto> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, PaymentLookupDto.class);
            
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to lookup payment for appointment {}: {}", appointmentId, e.getMessage());
            return null;
        }
    }
}
