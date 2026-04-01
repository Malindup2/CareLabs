package com.carelabs.patientservice.repository;

import com.carelabs.patientservice.entity.SymptomCheck;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SymptomCheckRepository extends JpaRepository<SymptomCheck, UUID> {
    List<SymptomCheck> findByPatientId(UUID patientId);
}