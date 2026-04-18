package com.carelabs.appointments.dto;

import com.carelabs.appointments.enums.TicketCategory;
import lombok.Data;

import java.util.UUID;

@Data
public class SupportTicketRequest {
    private TicketCategory category;
    private String description;
    private UUID appointmentId;
    private String accountNumber;
    private String bankName;
    private String branchName;
}
