package com.carelabs.appointments.service;

import com.carelabs.appointments.dto.AppointmentRequest;
import com.carelabs.appointments.entity.Appointment;
import com.carelabs.appointments.enums.AppointmentStatus;
import com.carelabs.appointments.repository.AppointmentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;

    public AppointmentService(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    public Appointment bookAppointment(AppointmentRequest request) {
        // Create the new appointment
        Appointment appointment = new Appointment();
        appointment.setPatientId(request.getPatientId());
        appointment.setDoctorId(request.getDoctorId());
        appointment.setAppointmentTime(request.getAppointmentTime());
        appointment.setType(request.getType());
        appointment.setReason(request.getReason());
        
        // Set the system defaults for a brand new booking
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setDurationMinutes(30);
        appointment.setConsultationFee(new BigDecimal("1500.00")); //Hardcoded here for test

        // Save to the database
        return appointmentRepository.save(appointment);
    }

    public List<Appointment> getAppointmentsByPatient(UUID patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    public List<Appointment> getAppointmentsByDoctor(UUID doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    public Appointment getAppointmentById(UUID id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
    }

    public Appointment updateAppointmentStatus(UUID id, AppointmentStatus newStatus) {
        Appointment appointment = getAppointmentById(id);
        appointment.setStatus(newStatus);
        return appointmentRepository.save(appointment);
    }

    //Cancel an appointment
    public void deleteAppointment(UUID id) {
        if (!appointmentRepository.existsById(id)) {
            throw new RuntimeException("Appointment not found with ID: " + id);
        }
        appointmentRepository.deleteById(id);
    }

    //Reschedule an appointment
    public Appointment rescheduleAppointment(UUID id, java.time.LocalDateTime newTime) {
        Appointment appointment = getAppointmentById(id);
        
        // Check if the new time is available (STUBB)
        boolean isDoctorAvailable = checkDoctorAvailabilityStub(appointment.getDoctorId(), newTime);
        if (!isDoctorAvailable) {
            throw new RuntimeException("Doctor is not available at the new time.");
        }

        appointment.setAppointmentTime(newTime);
        return appointmentRepository.save(appointment);
    }

    //Get available slots (STUBBED)
    public List<java.time.LocalTime> getAvailableSlots(UUID doctorId, java.time.LocalDate date) {
        //will return dummy available slots(just untill doc service)
        
        return List.of(
                java.time.LocalTime.of(9, 0),
                java.time.LocalTime.of(9, 30),
                java.time.LocalTime.of(10, 0),
                java.time.LocalTime.of(14, 0),
                java.time.LocalTime.of(14, 30)
        );
    }

    // Helper stub for availability check
    private boolean checkDoctorAvailabilityStub(UUID doctorId, java.time.LocalDateTime time) {
       
        return true;
    }
}
