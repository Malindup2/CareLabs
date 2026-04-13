package com.carelabs.patientservice.service;

import com.carelabs.patientservice.dto.UserCreatedEvent;
import com.carelabs.patientservice.entity.Patient;
import com.carelabs.patientservice.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserRegistrationConsumer {

    private final PatientRepository patientRepository;

    @KafkaListener(topics = "user-registration", groupId = "patient-service-group")
    public void consume(UserCreatedEvent event) {
        log.info("Received UserCreatedEvent: {}", event);

        if ("PATIENT".equalsIgnoreCase(event.getRole())) {
            if (patientRepository.findByUserId(event.getUserId()).isPresent()) {
                log.info("Patient profile already exists for userId: {}", event.getUserId());
                return;
            }

            Patient patient = new Patient();
            patient.setUserId(event.getUserId());
            patient.setFullName("Pending Profile"); // Placeholder
            
            patientRepository.save(patient);
            log.info("Created base patient profile for userId: {}", event.getUserId());
        }
    }
}
