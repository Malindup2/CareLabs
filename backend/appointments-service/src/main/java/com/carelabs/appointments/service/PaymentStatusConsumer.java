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
            appointment.setStatus(AppointmentStatus.CONFIRMED);
            appointmentRepository.save(appointment);
            log.info("GATEWAY CHECK - Appointment {} CONFIRMED via successful payment.", event.getAppointmentId());
        } else if ("FAILED".equalsIgnoreCase(event.getStatus())) {
            appointment.setStatus(AppointmentStatus.CANCELLED);
            appointmentRepository.save(appointment);
            log.info("GATEWAY CHECK - Appointment {} CANCELLED due to failed payment.", event.getAppointmentId());
        } else {
            log.info("GATEWAY CHECK - Payment event for appointment {} has status: {}. No action taken.", 
                    event.getAppointmentId(), event.getStatus());
        }
    }
}
