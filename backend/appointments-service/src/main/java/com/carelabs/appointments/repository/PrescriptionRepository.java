package com.carelabs.appointments.repository;

import com.carelabs.appointments.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, UUID> {
    Optional<Prescription> findByAppointmentId(UUID appointmentId);
    java.util.List<Prescription> findByPatientId(UUID patientId);
}
