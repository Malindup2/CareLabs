package com.carelabs.notificationservice.service;

import com.carelabs.notificationservice.dto.AppointmentDto;
import com.carelabs.notificationservice.dto.NotificationRequest;
import com.carelabs.notificationservice.dto.UserEmailDto;
import com.carelabs.notificationservice.enums.NotificationEvent;
import com.carelabs.notificationservice.enums.NotificationStatus;
import com.carelabs.notificationservice.repository.NotificationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Scheduled job that runs every 15 minutes.
 *
 * Logic:
 *  1. Fetch ALL appointments from appointment-service (GET /appointments)
 *  2. Filter appointments that are:
 *     - Status = ACCEPTED or PENDING (i.e. not yet cancelled/completed)
 *     - appointmentTime is between NOW+1h45m and NOW+2h15m (30-minute window centred at 2h)
 *  3. For each matching appointment, check if a reminder was already sent (deduplication)
 *  4. Send reminder emails to BOTH patient and doctor
 *  5. Save notification records
 */
@Service
@Slf4j
public class ReminderSchedulerService {

    private final RestTemplate restTemplate;
    private final NotificationService notificationService;
    private final UserLookupService userLookupService;
    private final EmailService emailService;
    private final EmailTemplateService emailTemplateService;
    private final NotificationRepository notificationRepository;

    @Value("${services.appointment-url}")
    private String appointmentServiceUrl;

    private static final DateTimeFormatter DISPLAY_FORMAT =
            DateTimeFormatter.ofPattern("EEEE, dd MMMM yyyy 'at' hh:mm a");

    public ReminderSchedulerService(RestTemplate restTemplate,
                                    NotificationService notificationService,
                                    UserLookupService userLookupService,
                                    EmailService emailService,
                                    EmailTemplateService emailTemplateService,
                                    NotificationRepository notificationRepository) {
        this.restTemplate = restTemplate;
        this.notificationService = notificationService;
        this.userLookupService = userLookupService;
        this.emailService = emailService;
        this.emailTemplateService = emailTemplateService;
        this.notificationRepository = notificationRepository;
    }

    /**
     * Runs every 15 minutes.
     * fixedDelay = 15 * 60 * 1000 ms
     * initialDelay = 60s (give other services time to start up first)
     */
    @Scheduled(fixedDelay = 15 * 60 * 1000, initialDelay = 60 * 1000)
    public void sendAppointmentReminders() {
        log.info("⏰ ReminderScheduler: Checking for upcoming appointments...");

        AppointmentDto[] appointments = fetchAllAppointments();
        if (appointments == null || appointments.length == 0) {
            log.info("No appointments found from appointment-service.");
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        // 30-minute window centred on "2 hours from now"
        LocalDateTime windowStart = now.plusHours(1).plusMinutes(45);
        LocalDateTime windowEnd   = now.plusHours(2).plusMinutes(15);

        int remindersScheduled = 0;

        for (AppointmentDto appt : appointments) {
            if (appt.getAppointmentTime() == null) continue;
            if (appt.getId() == null) continue;

            // Only ACCEPTED or PENDING appointments need a reminder
            String status = appt.getStatus();
            if (!"ACCEPTED".equalsIgnoreCase(status) && !"PENDING".equalsIgnoreCase(status)) continue;

            LocalDateTime apptTime = appt.getAppointmentTime();
            if (apptTime.isBefore(windowStart) || apptTime.isAfter(windowEnd)) continue;

            // Deduplication: skip if reminder already sent for this appointment
            if (notificationRepository.existsByAppointmentIdAndEvent(
                    appt.getId(), NotificationEvent.APPOINTMENT_REMINDER)) {
                log.debug("Reminder already sent for appointmentId={}", appt.getId());
                continue;
            }

            // Send to both patient and doctor
            sendReminderTo(appt, appt.getPatientId(), "Patient");
            sendReminderTo(appt, appt.getDoctorId(), "Doctor");
            remindersScheduled++;
        }

        log.info("⏰ ReminderScheduler: Processed reminders for {} appointments.", remindersScheduled);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private void sendReminderTo(AppointmentDto appt, UUID userId, String role) {
        if (userId == null) return;

        UserEmailDto user = userLookupService.getUserById(userId);
        if (user == null || user.getEmail() == null) {
            log.warn("Could not resolve email for {} userId={}", role, userId);
            return;
        }

        // Resolve the "other party" name for the email
        String otherPartyLabel = "PATIENT".equalsIgnoreCase(role) ? "Doctor" : "Patient";
        UUID otherPartyId       = "PATIENT".equalsIgnoreCase(role) ? appt.getDoctorId() : appt.getPatientId();

        UserEmailDto otherParty = userLookupService.getUserById(otherPartyId);
        String otherPartyName   = (otherParty != null) ? otherParty.getEmail() : "your " + otherPartyLabel.toLowerCase();

        Map<String, String> extraData = new HashMap<>();
        extraData.put("recipientName",  user.getEmail()); // fallback to email if no full name
        extraData.put("otherPartyName", otherPartyName);
        extraData.put("otherPartyRole", otherPartyLabel);
        extraData.put("appointmentTime", appt.getAppointmentTime().format(DISPLAY_FORMAT));
        extraData.put("appointmentType", appt.getType() != null ? appt.getType() : "N/A");
        extraData.put("meetingLink", "https://meet.jit.si/CareLabs-Consultation-" + appt.getId());

        NotificationRequest request = NotificationRequest.builder()
                .targetUserId(userId)
                .appointmentId(appt.getId())
                .event(NotificationEvent.APPOINTMENT_REMINDER)
                .extraData(extraData)
                .build();

        // Build and send email directly (bypass processNotification to avoid double user-lookup)
        NotificationStatus status = NotificationStatus.FAILED;
        try {
            String subject  = emailTemplateService.buildSubject(NotificationEvent.APPOINTMENT_REMINDER);
            String htmlBody = emailTemplateService.buildHtml(NotificationEvent.APPOINTMENT_REMINDER, extraData);
            emailService.sendHtmlEmail(user.getEmail(), subject, htmlBody);
            status = NotificationStatus.SENT;
            log.info("Reminder email sent to {} ({})", user.getEmail(), role);
        } catch (Exception e) {
            log.error("Failed to send reminder email to {}: {}", user.getEmail(), e.getMessage());
        }

        // Persist notification record
        notificationService.saveNotification(request, status, user.getEmail());
    }

    private AppointmentDto[] fetchAllAppointments() {
        String url = appointmentServiceUrl + "/appointments";
        try {
            return restTemplate.getForObject(url, AppointmentDto[].class);
        } catch (RestClientException e) {
            log.error("Failed to fetch appointments from appointment-service: {}", e.getMessage());
            return null;
        }
    }
}