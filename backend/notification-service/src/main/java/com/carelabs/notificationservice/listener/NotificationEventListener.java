package com.carelabs.notificationservice.listener;

import com.carelabs.notificationservice.dto.events.AppointmentBookedEvent;
import com.carelabs.notificationservice.dto.events.PaymentStatusEvent;
import com.carelabs.notificationservice.dto.events.UserCreatedEvent;
import com.carelabs.notificationservice.dto.NotificationRequest;
import com.carelabs.notificationservice.dto.AppointmentViewDto;
import com.carelabs.notificationservice.dto.UserEmailDto;
import com.carelabs.notificationservice.enums.NotificationEvent;
import com.carelabs.notificationservice.service.AppointmentLookupService;
import com.carelabs.notificationservice.service.NotificationService;
import com.carelabs.notificationservice.service.UserLookupService;
import com.carelabs.notificationservice.service.DoctorLookupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.UUID;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;
    private final UserLookupService userLookupService;
    private final AppointmentLookupService appointmentLookupService;
    private final DoctorLookupService doctorLookupService;

    @KafkaListener(topics = "appointment-events", groupId = "notification-group-v2")
    public void handleAppointmentBooked(AppointmentBookedEvent event) {
        log.info("Received appointment-events: appointmentId={}", event.getAppointmentId());

        UserEmailDto patient = userLookupService.getUserById(event.getPatientId());
        
        // Resolve Doctor UserId from DoctorId
        UUID doctorUserId = event.getDoctorId();
        var doctorProfile = doctorLookupService.getDoctorById(event.getDoctorId());
        if (doctorProfile != null && doctorProfile.getUserId() != null) {
            doctorUserId = doctorProfile.getUserId();
        }

        UserEmailDto doctor = userLookupService.getUserById(doctorUserId);

        String patientName = patient != null ? patient.getFullName() : "Patient";
        String doctorName = (doctorProfile != null && doctorProfile.getFullName() != null) 
                ? doctorProfile.getFullName() 
                : (doctor != null ? doctor.getFullName() : "Doctor");
        String timeStr = event.getAppointmentTime().toString();

        // 1. Notify Doctor
        Map<String, String> doctorData = new HashMap<>();
        doctorData.put("patientName", patientName);
        doctorData.put("appointmentTime", timeStr);
        
        notificationService.processNotification(NotificationRequest.builder()
                .targetUserId(doctorUserId)
                .appointmentId(event.getAppointmentId())
                .event(NotificationEvent.APPOINTMENT_BOOKED)
                .extraData(doctorData)
                .build());

        // 2. Notify Patient (In-app only or welcome message)
        Map<String, String> patientData = new HashMap<>();
        patientData.put("doctorName", doctorName);
        patientData.put("appointmentTime", timeStr);

        notificationService.processNotification(NotificationRequest.builder()
                .targetUserId(event.getPatientId())
                .appointmentId(event.getAppointmentId())
                .event(NotificationEvent.APPOINTMENT_ACCEPTED) // Using Accepted as "Booked Confirmation"
                .extraData(patientData)
                .build());
    }

    @KafkaListener(topics = "payment-events", groupId = "notification-group-v2")
    public void handlePaymentStatus(PaymentStatusEvent event) {
        log.info("Received payment-events: appointmentId={}, status={}", event.getAppointmentId(), event.getStatus());

        AppointmentViewDto appointment = appointmentLookupService.getAppointmentById(event.getAppointmentId());
        if (appointment == null) return;

        UserEmailDto patient = userLookupService.getUserById(appointment.getPatientId());
        
        // Resolve Doctor profile first for the name
        var doctorProfile = doctorLookupService.getDoctorById(appointment.getDoctorId());
        UserEmailDto doctor = null;
        UUID doctorUserId = appointment.getDoctorId();
        
        if (doctorProfile != null && doctorProfile.getUserId() != null) {
            doctorUserId = doctorProfile.getUserId();
            doctor = userLookupService.getUserById(doctorUserId);
        }

        Map<String, String> data = new HashMap<>();
        data.put("doctorName", (doctorProfile != null && doctorProfile.getFullName() != null) 
                ? doctorProfile.getFullName() 
                : (doctor != null ? doctor.getFullName() : "Doctor"));
        data.put("patientName", patient != null ? patient.getFullName() : "Patient");
        data.put("appointmentTime", appointment.getAppointmentTime().toString());

        if ("SUCCESS".equalsIgnoreCase(event.getStatus())) {
            // Notify Patient
            notificationService.processNotification(NotificationRequest.builder()
                    .targetUserId(appointment.getPatientId())
                    .appointmentId(appointment.getId())
                    .event(NotificationEvent.PAYMENT_SUCCESS)
                    .extraData(data)
                    .build());

            // Notify Doctor (UserId already resolved above)
            notificationService.processNotification(NotificationRequest.builder()
                    .targetUserId(doctorUserId)
                    .appointmentId(appointment.getId())
                    .event(NotificationEvent.PAYMENT_SUCCESS)
                    .extraData(data)
                    .build());
        } else {
            // Notify Patient of failure
            notificationService.processNotification(NotificationRequest.builder()
                    .targetUserId(appointment.getPatientId())
                    .appointmentId(appointment.getId())
                    .event(NotificationEvent.PAYMENT_FAILED)
                    .extraData(data)
                    .build());
        }
    }

    @KafkaListener(topics = "user-registration", groupId = "notification-group-v2")
    public void handleUserRegistration(UserCreatedEvent event) {
        log.info("Received user-registration: userId={}, role={}", event.getUserId(), event.getRole());

        // Notify the new user
        Map<String, String> data = new HashMap<>();
        data.put("fullName", event.getFullName());
        
        // For Doctors, we notify about "DOC_APPROVED" logic elsewhere, but here we can send a welcome
        if ("PATIENT".equalsIgnoreCase(event.getRole())) {
             notificationService.processNotification(NotificationRequest.builder()
                    .targetUserId(event.getUserId())
                    .event(NotificationEvent.ANNOUNCEMENT) // Generic welcome
                    .extraData(Map.of("title", "Welcome to CareLabs", "message", "Thank you for registering!"))
                    .build());
        }
    }
}
