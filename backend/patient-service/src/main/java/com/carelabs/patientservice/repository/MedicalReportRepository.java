package com.carelabs.patientservice.repository;

import com.carelabs.patientservice.entity.MedicalReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MedicalReportRepository extends JpaRepository<MedicalReport, UUID> {

    List<MedicalReport> findByPatientId(UUID patientId);
}