package com.carelabs.patientservice.repository;

import com.carelabs.patientservice.entity.PatientAllergy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PatientAllergyRepository extends JpaRepository<PatientAllergy, UUID> {

    List<PatientAllergy> findByPatientId(UUID patientId);

    Optional<PatientAllergy> findByIdAndPatientId(UUID id, UUID patientId);
}