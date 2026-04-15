package com.carelabs.appointments.service;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class DoctorFeeLookupService {

    private final RestTemplate restTemplate;

    @Value("${integration.doctor-service.base-url:http://doctor-service:8083}")
    private String doctorServiceBaseUrl;

    public DoctorFeeLookupService() {
        this.restTemplate = new RestTemplate();
    }

    public BigDecimal findDoctorConsultationFee(UUID doctorId) {
        try {
            String url = doctorServiceBaseUrl + "/doctors/" + doctorId;
            Map<?, ?> doctorPayload = restTemplate.getForObject(url, Map.class);
            if (doctorPayload == null) {
                return null;
            }

            Object fee = doctorPayload.get("consultationFee");
            if (fee == null) {
                return null;
            }

            return new BigDecimal(String.valueOf(fee));
        } catch (Exception ignored) {
            return null;
        }
    }
}