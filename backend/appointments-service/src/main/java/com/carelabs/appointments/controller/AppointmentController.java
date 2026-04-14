package com.carelabs.appointments.controller;

import com.carelabs.appointments.dto.AppointmentRequest;
import com.carelabs.appointments.dto.AppointmentResponse;
import com.carelabs.appointments.entity.Appointment;
import com.carelabs.appointments.enums.AppointmentStatus;
import com.carelabs.appointments.service.AppointmentService;
import com.carelabs.appointments.service.DoctorScheduleLookupService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final DoctorScheduleLookupService doctorScheduleLookupService;

    public AppointmentController(AppointmentService appointmentService,
                                 DoctorScheduleLookupService doctorScheduleLookupService) {
        this.appointmentService = appointmentService;
        this.doctorScheduleLookupService = doctorScheduleLookupService;
    }

    //Book a new appointment
    @PostMapping
    public ResponseEntity<Appointment> bookAppointment(@RequestBody AppointmentRequest request) {
        return ResponseEntity.ok(appointmentService.bookAppointment(request));
    }

    //View patient history
    @PreAuthorize("hasRole('ADMIN') or hasRole('PATIENT')")
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Appointment>> getPatientAppointments(@PathVariable UUID patientId,
                                                                    Authentication authentication) {
        ensurePatientOwnsRequestedPatientId(patientId, authentication);
        return ResponseEntity.ok(appointmentService.getAppointmentsByPatient(patientId));
    }

    //View doctor schedule
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<AppointmentResponse>> getDoctorAppointments(@PathVariable UUID doctorId,
                                                                   Authentication authentication) {
        ensureDoctorOwnsRequestedDoctorId(doctorId, authentication);
        return ResponseEntity.ok(appointmentService.getAppointmentsByDoctor(doctorId));
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    @GetMapping("/doctor/{doctorId}/slot-allocation")
    public ResponseEntity<List<com.carelabs.appointments.dto.DoctorSlotAllocationItem>> getDoctorSlotAllocation(
            @PathVariable UUID doctorId,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate date,
            Authentication authentication) {
        ensureDoctorOwnsRequestedDoctorId(doctorId, authentication);
        return ResponseEntity.ok(appointmentService.getDoctorDailySlotAllocation(doctorId, date));
    }

    private void ensureDoctorOwnsRequestedDoctorId(UUID requestedDoctorId, Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            throw new AccessDeniedException("Unauthorized doctor access");
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (isAdmin) {
            return;
        }

        boolean isDoctor = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_DOCTOR".equals(a.getAuthority()));
        if (!isDoctor) {
            throw new AccessDeniedException("Unauthorized doctor access");
        }

        UUID userId;
        try {
            userId = UUID.fromString(String.valueOf(authentication.getPrincipal()));
        } catch (Exception ex) {
            throw new AccessDeniedException("Invalid authenticated user id");
        }

        UUID doctorId = doctorScheduleLookupService.getDoctorIdByUserId(userId);
        if (doctorId == null || !doctorId.equals(requestedDoctorId)) {
            throw new AccessDeniedException("Doctor can only access own appointment data");
        }
    }

    private void ensurePatientOwnsRequestedPatientId(UUID requestedPatientId, Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            throw new AccessDeniedException("Unauthorized patient access");
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (isAdmin) {
            return;
        }

        boolean isPatient = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_PATIENT".equals(a.getAuthority()));
        if (!isPatient) {
            throw new AccessDeniedException("Unauthorized patient access");
        }

        UUID authenticatedUserId;
        try {
            authenticatedUserId = UUID.fromString(String.valueOf(authentication.getPrincipal()));
        } catch (Exception ex) {
            throw new AccessDeniedException("Invalid authenticated user id");
        }

        if (!authenticatedUserId.equals(requestedPatientId)) {
            throw new AccessDeniedException("Patient can only access own appointment data");
        }
    }

    //Get specific appointment details
    @PreAuthorize("hasRole('ADMIN') or hasRole('PATIENT') or hasRole('DOCTOR')")
    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getAppointmentById(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.getAppointmentById(id));
    }

    //Update appointment status
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    @PutMapping("/{id}/status")
    public ResponseEntity<Appointment> updateStatus(
            @PathVariable UUID id, 
            @RequestParam AppointmentStatus status) {
        return ResponseEntity.ok(appointmentService.updateAppointmentStatus(id, status));
    }

    //Cancel an appointment
    @PreAuthorize("hasRole('ADMIN') or hasRole('PATIENT')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable UUID id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.noContent().build(); // Returns a 204 No Content success status
    }

    //Reschedule an appointment
    @PreAuthorize("hasRole('ADMIN') or hasRole('PATIENT')")
    @PutMapping("/{id}")
    public ResponseEntity<Appointment> rescheduleAppointment(
            @PathVariable UUID id, 
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime newTime) {
        return ResponseEntity.ok(appointmentService.rescheduleAppointment(id, newTime));
    }

    //Get available slots for a doctor on a specific date
    @PreAuthorize("hasRole('ADMIN') or hasRole('PATIENT') or hasRole('DOCTOR')")
    @GetMapping("/available-slots")
    public ResponseEntity<List<java.time.LocalTime>> getAvailableSlots(
            @RequestParam UUID doctorId, 
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate date) {
        return ResponseEntity.ok(appointmentService.getAvailableSlots(doctorId, date));
    }

    //Get the Video Meeting Link
    @PreAuthorize("hasRole('ADMIN') or hasRole('PATIENT') or hasRole('DOCTOR')")
    @GetMapping("/{id}/meeting-link")
    public ResponseEntity<java.util.Map<String, String>> getMeetingLink(@PathVariable UUID id) {
        String link = appointmentService.getMeetingLink(id);
        return ResponseEntity.ok(java.util.Map.of("meetingUrl", link));
    }

    //Send a Chat Message
    @PreAuthorize("hasRole('ADMIN') or hasRole('PATIENT') or hasRole('DOCTOR')")
    @PostMapping("/{id}/chat")
    public ResponseEntity<com.carelabs.appointments.entity.ChatMessage> sendChatMessage(
            @PathVariable UUID id, 
            @RequestBody com.carelabs.appointments.dto.ChatMessageRequest request) {
        return ResponseEntity.ok(appointmentService.saveChatMessage(id, request));
    }

    //Get Chat History
    @PreAuthorize("hasRole('ADMIN') or hasRole('PATIENT') or hasRole('DOCTOR')")
    @GetMapping("/{id}/chat")
    public ResponseEntity<List<com.carelabs.appointments.entity.ChatMessage>> getChatHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.getChatHistory(id));
    }

    //Save a Consultation Note
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    @PostMapping("/{id}/notes")
    public ResponseEntity<com.carelabs.appointments.entity.ConsultationNote> saveNote(
            @PathVariable UUID id, @RequestBody com.carelabs.appointments.entity.ConsultationNote note) {
        return ResponseEntity.ok(appointmentService.saveNote(id, note));
    }

    //Get a Consultation Note
    @PreAuthorize("hasRole('ADMIN') or hasRole('PATIENT') or hasRole('DOCTOR')")
    @GetMapping("/{id}/notes")
    public ResponseEntity<com.carelabs.appointments.entity.ConsultationNote> getNote(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.getNote(id));
    }

    //Save a Prescription
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    @PostMapping("/{id}/prescriptions")
    public ResponseEntity<com.carelabs.appointments.entity.Prescription> savePrescription(
            @PathVariable UUID id, @RequestBody com.carelabs.appointments.entity.Prescription prescription) {
        return ResponseEntity.ok(appointmentService.savePrescription(id, prescription));
    }

    //Get a Prescription
    @PreAuthorize("hasRole('ADMIN') or hasRole('PATIENT') or hasRole('DOCTOR')")
    @GetMapping("/prescriptions/{id}")
    public ResponseEntity<com.carelabs.appointments.entity.Prescription> getPrescription(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.getPrescription(id));
    }

    //Save a Review
    @PreAuthorize("hasRole('ADMIN') or hasRole('PATIENT')")
    @PostMapping("/{id}/review")
    public ResponseEntity<com.carelabs.appointments.entity.Review> saveReview(
            @PathVariable UUID id, @RequestBody com.carelabs.appointments.entity.Review review) {
        return ResponseEntity.ok(appointmentService.saveReview(id, review));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }
}
