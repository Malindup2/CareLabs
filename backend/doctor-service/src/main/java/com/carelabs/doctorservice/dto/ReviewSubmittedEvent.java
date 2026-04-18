package com.carelabs.doctorservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewSubmittedEvent {
    private UUID appointmentId;
    private UUID doctorId;
    private Integer rating;
}
