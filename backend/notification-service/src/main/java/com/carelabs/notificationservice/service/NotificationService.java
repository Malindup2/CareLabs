package com.carelabs.notificationservice.service;

import com.carelabs.notificationservice.dto.NotificationRequest;
import com.carelabs.notificationservice.dto.NotificationResponse;
import com.carelabs.notificationservice.dto.UserEmailDto;
import com.carelabs.notificationservice.entity.Notification;
import com.carelabs.notificationservice.enums.NotificationStatus;
import com.carelabs.notificationservice.enums.NotificationType;
import com.carelabs.notificationservice.repository.NotificationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Core orchestrator of the notification service.
 *
 * Flow when a notification is triggered:
 *  1. Receive NotificationRequest (from another microservice via POST /notifications)
 *  2. Look up the target user's email from auth-service
 *  3. Build the subject + HTML body using EmailTemplateService
 *  4. Send email via EmailService (JavaMailSender)
 *  5. Persist the Notification record with status SENT or FAILED
 *  6. Return a NotificationResponse
 */
@Service
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserLookupService userLookupService;
    private final EmailService emailService;
    private final EmailTemplateService emailTemplateService;

    public NotificationService(NotificationRepository notificationRepository,
                               UserLookupService userLookupService,
                               EmailService emailService,
                               EmailTemplateService emailTemplateService) {
        this.notificationRepository = notificationRepository;
        this.userLookupService = userLookupService;
        this.emailService = emailService;
        this.emailTemplateService = emailTemplateService;
    }

    // ─── Primary trigger ──────────────────────────────────────────────────────

    /**
     * Called by POST /notifications.
     * This is the entry point for all other microservices to trigger a notification.
     */
    public NotificationResponse processNotification(NotificationRequest request) {
        log.info("Processing notification: event={} for userId={}", request.getEvent(), request.getTargetUserId());

        // 1. Look up the user's email from auth-service
        UserEmailDto user = userLookupService.getUserById(request.getTargetUserId());

        NotificationStatus status = NotificationStatus.FAILED;
        String recipientEmail = null;

        if (user != null && user.getEmail() != null) {
            recipientEmail = user.getEmail();

            try {
                // 2. Build subject + HTML body
                String subject = emailTemplateService.buildSubject(request.getEvent());
                String htmlBody = emailTemplateService.buildHtml(request.getEvent(), request.getExtraData());

                // 3. Send the email — catches both MessagingException and UnsupportedEncodingException
                emailService.sendHtmlEmail(recipientEmail, subject, htmlBody);
                status = NotificationStatus.SENT;

            } catch (Exception e) {
                // Catches MessagingException, UnsupportedEncodingException, or any runtime error
                log.error("Failed to send email to {} for event {}: {}", recipientEmail, request.getEvent(), e.getMessage());
                // status stays FAILED
            }
        } else {
            log.warn("Could not resolve email for userId={}. Notification saved as FAILED.", request.getTargetUserId());
        }

        // 4. Persist the notification record regardless of send outcome
        Notification saved = saveNotification(request, status, recipientEmail);

        return toResponse(saved);
    }

    // ─── History & read management ────────────────────────────────────────────

    /**
     * Returns all notifications for a given user, newest first.
     * Called by GET /notifications?userId={id}
     */
    public List<NotificationResponse> getNotificationsForUser(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Marks a notification as read.
     * Called by PUT /notifications/{id}/read
     */
    public NotificationResponse markAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + notificationId));
        notification.setRead(true);
        return toResponse(notificationRepository.save(notification));
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    /**
     * Builds and saves a Notification entity.
     * Called both from processNotification() and from ReminderSchedulerService.
     */
    public Notification saveNotification(NotificationRequest request,
                                          NotificationStatus status,
                                          String recipientEmail) {
        // Derive a human-readable title and message from the event type
        String title = emailTemplateService.buildSubject(request.getEvent())
                .replaceAll("[✅🎉❌⚠️⏰💳🚨🔄💰💊💵🏥]", "").trim();

        String message = buildPlainTextMessage(request);

        Notification notification = Notification.builder()
                .userId(request.getTargetUserId())
                .appointmentId(request.getAppointmentId())
                .type(NotificationType.EMAIL)
                .event(request.getEvent())
                .title(title)
                .message(message)
                .recipientEmail(recipientEmail)
                .status(status)
                .read(false)
                .build();

        return notificationRepository.save(notification);
    }

    /** Builds a short plain-text summary for the notification history panel */
    private String buildPlainTextMessage(NotificationRequest request) {
        var data = request.getExtraData();
        if (data == null) return request.getEvent().name();

        return switch (request.getEvent()) {
            case APPOINTMENT_BOOKED    -> "New appointment request from " + data.getOrDefault("patientName", "a patient")
                                        + " on " + data.getOrDefault("appointmentTime", "");
            case APPOINTMENT_ACCEPTED  -> "Your appointment with Dr. " + data.getOrDefault("doctorName", "")
                                        + " has been confirmed for " + data.getOrDefault("appointmentTime", "");
            case APPOINTMENT_REJECTED  -> "Your appointment with Dr. " + data.getOrDefault("doctorName", "")
                                        + " was not accepted.";
            case APPOINTMENT_CANCELLED -> "Appointment with " + data.getOrDefault("patientName", "a patient")
                                        + " on " + data.getOrDefault("appointmentTime", "") + " has been cancelled.";
            case APPOINTMENT_REMINDER  -> "Reminder: Appointment in 2 hours at "
                                        + data.getOrDefault("appointmentTime", "");
            case PAYMENT_SUCCESS       -> "Payment of " + data.getOrDefault("currency", "LKR") + " "
                                        + data.getOrDefault("amount", "") + " confirmed.";
            case PAYMENT_FAILED        -> "Payment of " + data.getOrDefault("currency", "LKR") + " "
                                        + data.getOrDefault("amount", "") + " failed. Please retry.";
            case REFUND_REQUESTED      -> "Refund of " + data.getOrDefault("currency", "LKR") + " "
                                        + data.getOrDefault("amount", "") + " requested.";
            case REFUND_PROCESSED      -> "Refund of " + data.getOrDefault("currency", "LKR") + " "
                                        + data.getOrDefault("amount", "") + " has been processed.";
            case PRESCRIPTION_ISSUED   -> "A new prescription has been issued by Dr. "
                                        + data.getOrDefault("doctorName", "");
            case DOC_APPROVED          -> "Your doctor account has been verified and approved.";
            case DOC_REJECTED          -> "Your doctor verification was rejected: "
                                        + data.getOrDefault("rejectionReason", "");
            case PAYOUT_PROCESSED      -> "Payout of " + data.getOrDefault("currency", "LKR") + " "
                                        + data.getOrDefault("amount", "") + " processed to your bank.";
        };
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .userId(n.getUserId())
                .appointmentId(n.getAppointmentId())
                .type(n.getType())
                .event(n.getEvent())
                .title(n.getTitle())
                .message(n.getMessage())
                .read(n.getRead())
                .status(n.getStatus())
                .createdAt(n.getCreatedAt())
                .build();
    }
}