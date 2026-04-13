package com.carelabs.doctorservice.repository;

import com.carelabs.doctorservice.entity.Doctor;
import com.carelabs.doctorservice.enums.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, UUID> {
    Optional<Doctor> findByUserId(UUID userId);
    List<Doctor> findByVerificationStatus(VerificationStatus status);
    List<Doctor> findByVerificationStatusAndActiveTrue(VerificationStatus status);
    List<Doctor> findByVerificationStatusAndActiveTrueAndSpecialtyContainingIgnoreCase(VerificationStatus status, String specialty);
}
