package com.carelabs.appointments.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentBookedEvent {
    private UUID appointmentId;
    private UUID patientId;
    private UUID doctorId;
    private LocalDateTime appointmentTime;
    private BigDecimal consultationFee;
}
