package com.carelabs.appointments.controller;

import com.carelabs.appointments.dto.AppointmentRequest;
import com.carelabs.appointments.entity.Appointment;
import com.carelabs.appointments.enums.AppointmentStatus;
import com.carelabs.appointments.service.AppointmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    //Book a new appointment
    @PreAuthorize("hasRole('ADMIN') or (hasRole('PATIENT') and #request.patientId.toString() == authentication.principal)")
    @PostMapping
    public ResponseEntity<Appointment> bookAppointment(@RequestBody AppointmentRequest request) {
        return ResponseEntity.ok(appointmentService.bookAppointment(request));
    }

    //View patient history
    @PreAuthorize("hasRole('ADMIN') or (hasRole('PATIENT') and #patientId.toString() == authentication.principal)")
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Appointment>> getPatientAppointments(@PathVariable UUID patientId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByPatient(patientId));
    }

    //View doctor schedule
    @PreAuthorize("hasRole('ADMIN') or (hasRole('DOCTOR') and #doctorId.toString() == authentication.principal)")
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Appointment>> getDoctorAppointments(@PathVariable UUID doctorId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByDoctor(doctorId));
    }

    //Get specific appointment details
    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getAppointmentById(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.getAppointmentById(id));
    }

    //Update appointment status
    @PutMapping("/{id}/status")
    public ResponseEntity<Appointment> updateStatus(
            @PathVariable UUID id, 
            @RequestParam AppointmentStatus status) {
        return ResponseEntity.ok(appointmentService.updateAppointmentStatus(id, status));
    }

    //Cancel an appointment
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable UUID id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.noContent().build(); // Returns a 204 No Content success status
    }

    //Reschedule an appointment
    @PutMapping("/{id}")
    public ResponseEntity<Appointment> rescheduleAppointment(
            @PathVariable UUID id, 
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime newTime) {
        return ResponseEntity.ok(appointmentService.rescheduleAppointment(id, newTime));
    }

    //Get available slots for a doctor on a specific date
    @GetMapping("/available-slots")
    public ResponseEntity<List<java.time.LocalTime>> getAvailableSlots(
            @RequestParam UUID doctorId, 
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate date) {
        return ResponseEntity.ok(appointmentService.getAvailableSlots(doctorId, date));
    }

    //Get the Video Meeting Link
    @GetMapping("/{id}/meeting-link")
    public ResponseEntity<java.util.Map<String, String>> getMeetingLink(@PathVariable UUID id) {
        String link = appointmentService.getMeetingLink(id);
        return ResponseEntity.ok(java.util.Map.of("meetingUrl", link));
    }

    //Send a Chat Message
    @PostMapping("/{id}/chat")
    public ResponseEntity<com.carelabs.appointments.entity.ChatMessage> sendChatMessage(
            @PathVariable UUID id, 
            @RequestBody com.carelabs.appointments.dto.ChatMessageRequest request) {
        return ResponseEntity.ok(appointmentService.saveChatMessage(id, request));
    }

    //Get Chat History
    @GetMapping("/{id}/chat")
    public ResponseEntity<List<com.carelabs.appointments.entity.ChatMessage>> getChatHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.getChatHistory(id));
    }

    //Save a Consultation Note
    @PostMapping("/{id}/notes")
    public ResponseEntity<com.carelabs.appointments.entity.ConsultationNote> saveNote(
            @PathVariable UUID id, @RequestBody com.carelabs.appointments.entity.ConsultationNote note) {
        return ResponseEntity.ok(appointmentService.saveNote(id, note));
    }

    //Get a Consultation Note
    @GetMapping("/{id}/notes")
    public ResponseEntity<com.carelabs.appointments.entity.ConsultationNote> getNote(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.getNote(id));
    }

    //Save a Prescription
    @PostMapping("/{id}/prescriptions")
    public ResponseEntity<com.carelabs.appointments.entity.Prescription> savePrescription(
            @PathVariable UUID id, @RequestBody com.carelabs.appointments.entity.Prescription prescription) {
        return ResponseEntity.ok(appointmentService.savePrescription(id, prescription));
    }

    //Get a Prescription
    @GetMapping("/prescriptions/{id}")
    public ResponseEntity<com.carelabs.appointments.entity.Prescription> getPrescription(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.getPrescription(id));
    }

    //Save a Review
    @PostMapping("/{id}/review")
    public ResponseEntity<com.carelabs.appointments.entity.Review> saveReview(
            @PathVariable UUID id, @RequestBody com.carelabs.appointments.entity.Review review) {
        return ResponseEntity.ok(appointmentService.saveReview(id, review));
    }

    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }
}
