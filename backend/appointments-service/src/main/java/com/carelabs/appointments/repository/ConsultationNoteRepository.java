package com.carelabs.appointments.repository;

import com.carelabs.appointments.entity.ConsultationNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConsultationNoteRepository extends JpaRepository<ConsultationNote, UUID> {
    Optional<ConsultationNote> findByAppointmentId(UUID appointmentId);
    java.util.List<ConsultationNote> findByPatientId(UUID patientId);
}
