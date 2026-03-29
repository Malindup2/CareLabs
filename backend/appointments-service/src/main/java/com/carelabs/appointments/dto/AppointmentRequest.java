package com.carelabs.appointments.dto;

import com.carelabs.appointments.enums.AppointmentType;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class AppointmentRequest {
    private UUID patientId; 
    private UUID doctorId;
    private LocalDateTime appointmentTime;
    private AppointmentType type; // IN_CLINIC or TELEMEDICINE
    private String reason;
}
