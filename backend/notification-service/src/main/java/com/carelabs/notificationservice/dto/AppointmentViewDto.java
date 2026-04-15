package com.carelabs.notificationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentViewDto {
    private UUID id;
    private UUID patientId;
    private UUID doctorId;
    private LocalDateTime appointmentTime;
    private String status;
}
