package com.carelabs.doctorservice.repository;

import com.carelabs.doctorservice.entity.DoctorDocument;
import com.carelabs.doctorservice.enums.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DoctorDocumentRepository extends JpaRepository<DoctorDocument, UUID> {
    List<DoctorDocument> findByDoctorId(UUID doctorId);
    List<DoctorDocument> findByDoctorIdAndStatus(UUID doctorId, VerificationStatus status);
}
