package com.carelabs.paymentservice.service;

import com.carelabs.paymentservice.dto.AppointmentBookedEvent;
import com.carelabs.paymentservice.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentBookedConsumer {

    private final PaymentRepository paymentRepository;

    /**
     * Listens for appointment-booked events for logging/auditing purposes only.
     * Payment records are created exclusively via the REST /payments/initiate endpoint
     * to avoid race conditions and duplicate key violations.
     */
    @KafkaListener(topics = "appointment-events", groupId = "payment-service-group")
    public void consume(AppointmentBookedEvent event) {
        log.info("Received AppointmentBookedEvent for AppointmentID: {}. Payment will be created when patient initiates checkout.", 
                event.getAppointmentId());
        
        // Just log. Do NOT create a Payment record here.
        // The payment is created in PaymentService.initiatePayment() when the patient clicks "Pay".
        // This avoids the race condition that caused duplicate key violations.
        
        boolean alreadyExists = paymentRepository.findByAppointmentId(event.getAppointmentId()).isPresent();
        if (alreadyExists) {
            log.info("Payment record already exists for appointmentId: {}", event.getAppointmentId());
        }
    }
}
