package com.carelabs.appointments.controller;

import com.carelabs.appointments.dto.SupportTicketRequest;
import com.carelabs.appointments.entity.SupportTicket;
import com.carelabs.appointments.service.SupportTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/appointments/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportTicketService supportTicketService;

    @PostMapping("/tickets")
    @PreAuthorize("hasRole('PATIENT')")
    public SupportTicket createTicket(@RequestBody SupportTicketRequest request, Authentication authentication) {
        UUID patientId = UUID.fromString(authentication.getName());
        return supportTicketService.createTicket(patientId, request);
    }

    @GetMapping("/tickets/me")
    @PreAuthorize("hasRole('PATIENT')")
    public List<SupportTicket> getMyTickets(Authentication authentication) {
        UUID patientId = UUID.fromString(authentication.getName());
        return supportTicketService.getPatientTickets(patientId);
    }

    @GetMapping("/tickets/all")
    @PreAuthorize("hasRole('ADMIN')")
    public List<SupportTicket> getAllTickets() {
        return supportTicketService.getAllTickets();
    }

    @PutMapping("/tickets/{id}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public SupportTicket resolveTicket(@PathVariable UUID id) {
        return supportTicketService.resolveTicket(id);
    }

    @PutMapping("/tickets/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public SupportTicket rejectTicket(@PathVariable UUID id) {
        return supportTicketService.rejectTicket(id);
    }
}
