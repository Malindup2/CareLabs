package com.carelabs.appointments.dto;

import com.carelabs.appointments.enums.AppointmentStatus;
import com.carelabs.appointments.enums.AppointmentType;
import java.time.LocalTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DoctorSlotAllocationItem {
    private LocalTime slotTime;
    private boolean booked;
    private UUID appointmentId;
    private UUID patientId;
    private AppointmentStatus appointmentStatus;
    private AppointmentType appointmentType;
    private String reason;
}
