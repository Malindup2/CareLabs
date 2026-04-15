package com.carelabs.notificationservice.dto.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;
import java.math.BigDecimal;

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
