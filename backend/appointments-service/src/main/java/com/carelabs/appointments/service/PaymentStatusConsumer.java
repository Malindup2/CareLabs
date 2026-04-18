package com.carelabs.appointments.service;

import com.carelabs.appointments.dto.PaymentStatusEvent;
import com.carelabs.appointments.entity.Appointment;
import com.carelabs.appointments.enums.AppointmentStatus;
import com.carelabs.appointments.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentStatusConsumer {

    private final AppointmentService appointmentService;
    private final AppointmentRepository appointmentRepository;


    @Transactional
    @KafkaListener(topics = "payment-events", groupId = "appointment-service-group-v2")
    public void consume(PaymentStatusEvent event) {
        log.info("GATEWAY CHECK - Received PaymentStatusEvent for AppointmentID: {}", event.getAppointmentId());
        log.info("GATEWAY CHECK - Status received: {}", event.getStatus());

        Appointment appointment = appointmentRepository.findById(event.getAppointmentId())
                .orElse(null);

        if (appointment == null) {
            log.warn("Appointment not found for ID: {}", event.getAppointmentId());
            return;
        }

        if ("SUCCESS".equalsIgnoreCase(event.getStatus())) {
            appointmentService.updateAppointmentStatus(event.getAppointmentId(), AppointmentStatus.CONFIRMED);
            log.info("Appointment {} confirmed via successful payment.", event.getAppointmentId());
        } else {
            log.info("Payment failed for appointment {}. Current status remains {}.", 
                    event.getAppointmentId(), appointment.getStatus());
            // Optionally: appointment.setStatus(AppointmentStatus.CANCELLED);
        }
    }
}
