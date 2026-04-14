package com.carelabs.appointments.dto;

import com.carelabs.appointments.enums.AppointmentStatus;
import com.carelabs.appointments.enums.AppointmentType;
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
public class AppointmentResponse {
    private UUID id;
    private UUID patientId;
    private String patientFullName;
    private UUID doctorId;
    private LocalDateTime appointmentTime;
    private Integer durationMinutes;
    private AppointmentStatus status;
    private AppointmentType type;
    private String reason;
    private BigDecimal consultationFee;
    private String meetingLink;
}
