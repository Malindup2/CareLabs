package com.carelabs.appointments.repository;

import com.carelabs.appointments.entity.Appointment;
import com.carelabs.appointments.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
    
    // find all appointments for a specific patient
    List<Appointment> findByPatientId(UUID patientId);
    
    // find all appointments for a specific doctor
    List<Appointment> findByDoctorId(UUID doctorId);

    boolean existsByDoctorIdAndAppointmentTimeAndStatusNotIn(
            UUID doctorId,
            LocalDateTime appointmentTime,
            List<AppointmentStatus> statuses
    );
}
