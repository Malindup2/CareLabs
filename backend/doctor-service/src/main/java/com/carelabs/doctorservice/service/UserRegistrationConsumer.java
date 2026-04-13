package com.carelabs.doctorservice.service;

import com.carelabs.doctorservice.dto.UserCreatedEvent;
import com.carelabs.doctorservice.entity.Doctor;
import com.carelabs.doctorservice.enums.VerificationStatus;
import com.carelabs.doctorservice.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserRegistrationConsumer {

    private final DoctorRepository doctorRepository;

    @KafkaListener(topics = "user-registration", groupId = "doctor-service-group")
    public void consume(UserCreatedEvent event) {
        log.info("Received UserCreatedEvent: {}", event);

        if ("DOCTOR".equalsIgnoreCase(event.getRole())) {
            if (doctorRepository.findByUserId(event.getUserId()).isPresent()) {
                log.info("Doctor profile already exists for userId: {}", event.getUserId());
                return;
            }

            Doctor doctor = new Doctor();
            doctor.setUserId(event.getUserId());
            doctor.setFullName("Pending Profile"); // Placeholder
            doctor.setSpecialty("PENDING");
            doctor.setSlmcNumber("PENDING");
            doctor.setExperienceYears(0);
            doctor.setQualification("PENDING");
            doctor.setBio("Pending Profile");
            doctor.setProfileImageUrl("");
            doctor.setConsultationFee(BigDecimal.ZERO);
            doctor.setAverageRating(0.0);
            doctor.setTotalReviews(0);
            doctor.setVerificationStatus(VerificationStatus.PENDING);
            doctor.setActive(false);
            
            doctorRepository.save(doctor);
            log.info("Created base doctor profile for userId: {}", event.getUserId());
        }
    }
}
