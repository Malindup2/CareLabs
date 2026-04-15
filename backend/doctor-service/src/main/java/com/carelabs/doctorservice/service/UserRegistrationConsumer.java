package com.carelabs.doctorservice.service;

import com.carelabs.doctorservice.dto.UserCreatedEvent;
import com.carelabs.doctorservice.entity.Doctor;
import com.carelabs.doctorservice.enums.VerificationStatus;
import com.carelabs.doctorservice.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.dao.DataIntegrityViolationException;
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

        if (!"DOCTOR".equalsIgnoreCase(event.getRole())) {
            return;
        }

        Doctor doctor = doctorRepository.findByUserId(event.getUserId())
                .orElseGet(() -> buildNewDoctor(event));

        mergeDoctorRegistrationData(doctor, event);

        try {
            doctorRepository.save(doctor);
            log.info("Upserted doctor profile for userId: {}", event.getUserId());
        } catch (DataIntegrityViolationException ex) {
            // Another path created the same userId profile concurrently.
            log.info("Doctor profile already exists after concurrent create for userId: {}", event.getUserId());
        }
    }

    private Doctor buildNewDoctor(UserCreatedEvent event) {
        Doctor doctor = new Doctor();
        doctor.setUserId(event.getUserId());
        doctor.setProfileImageUrl("");
        doctor.setAverageRating(0.0);
        doctor.setTotalReviews(0);
        doctor.setVerificationStatus(VerificationStatus.PENDING);
        doctor.setActive(false);
        doctor.setConsultationFee(BigDecimal.ZERO);
        return doctor;
    }

    private void mergeDoctorRegistrationData(Doctor doctor, UserCreatedEvent event) {
        if (hasText(event.getFullName())) {
            doctor.setFullName(event.getFullName().trim());
        }
        if (hasText(event.getSpecialty())) {
            doctor.setSpecialty(event.getSpecialty().trim());
        }
        if (hasText(event.getSlmcNumber())) {
            doctor.setSlmcNumber(event.getSlmcNumber().trim());
        }
        if (event.getExperienceYears() != null) {
            doctor.setExperienceYears(event.getExperienceYears());
        }
        if (hasText(event.getQualification())) {
            doctor.setQualification(event.getQualification().trim());
        }
        if (hasText(event.getBio())) {
            doctor.setBio(event.getBio().trim());
        }
        if (event.getConsultationFee() != null) {
            doctor.setConsultationFee(event.getConsultationFee());
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
