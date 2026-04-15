package com.carelabs.appointments.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.UUID;
import lombok.Data;

@Data
public class DoctorAvailabilityView {
    private UUID id;
    private UUID doctorId;
    private DayOfWeek dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer slotDuration;
}
