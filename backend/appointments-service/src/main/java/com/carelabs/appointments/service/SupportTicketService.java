package com.carelabs.appointments.service;

import com.carelabs.appointments.dto.SupportTicketRequest;
import com.carelabs.appointments.entity.Appointment;
import com.carelabs.appointments.entity.SupportTicket;
import com.carelabs.appointments.enums.AppointmentStatus;
import com.carelabs.appointments.enums.TicketCategory;
import com.carelabs.appointments.enums.TicketStatus;
import com.carelabs.appointments.repository.AppointmentRepository;
import com.carelabs.appointments.repository.SupportTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final AppointmentRepository appointmentRepository;

    public SupportTicket createTicket(UUID patientId, SupportTicketRequest request) {
        if (request.getCategory() == TicketCategory.REFUND) {
            if (request.getAppointmentId() == null) {
                throw new RuntimeException("Appointment ID is required for refunds");
            }
            Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
                    .orElseThrow(() -> new RuntimeException("Appointment not found"));

            if (!appointment.getPatientId().equals(patientId)) {
                throw new RuntimeException("Unauthorized: You do not own this appointment");
            }

            if (appointment.getStatus() != AppointmentStatus.PENDING && appointment.getStatus() != AppointmentStatus.CONFIRMED) {
                throw new RuntimeException("Refunds can only be requested for Pending or Confirmed appointments");
            }

            if (request.getAccountNumber() == null || request.getBankName() == null) {
                throw new RuntimeException("Bank details are required for refunds");
            }
        }

        SupportTicket ticket = SupportTicket.builder()
                .patientId(patientId)
                .category(request.getCategory())
                .description(request.getDescription())
                .appointmentId(request.getAppointmentId())
                .accountNumber(request.getAccountNumber())
                .bankName(request.getBankName())
                .branchName(request.getBranchName())
                .status(TicketStatus.OPEN)
                .build();

        return supportTicketRepository.save(ticket);
    }

    public List<SupportTicket> getPatientTickets(UUID patientId) {
        return supportTicketRepository.findByPatientId(patientId);
    }

    public List<SupportTicket> getAllTickets() {
        return supportTicketRepository.findAll();
    }

    public SupportTicket resolveTicket(UUID ticketId) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResolvedAt(LocalDateTime.now());
        return supportTicketRepository.save(ticket);
    }

    public SupportTicket rejectTicket(UUID ticketId) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        ticket.setStatus(TicketStatus.REJECTED);
        ticket.setResolvedAt(LocalDateTime.now());
        return supportTicketRepository.save(ticket);
    }
}
