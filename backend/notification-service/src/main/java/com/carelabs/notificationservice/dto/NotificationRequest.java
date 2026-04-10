package com.carelabs.notificationservice.dto;

import com.carelabs.notificationservice.enums.NotificationEvent;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

/**
 * Payload sent by other microservices (appointment-service, payment-service, etc.)
 * to POST /notifications to trigger an email notification.
 *
 * Example from appointment-service when a booking is made:
 * {
 *   "targetUserId": "uuid-of-doctor",
 *   "appointmentId": "uuid-of-appointment",
 *   "event": "APPOINTMENT_BOOKED",
 *   "extraData": {
 *     "patientName": "John Doe",
 *     "appointmentTime": "2025-08-15T10:00:00",
 *     "doctorName": "Dr. Perera"
 *   }
 * }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest {

    /**
     * The UUID of the user who should RECEIVE this notification.
     * This is the userId stored in the auth service (User.id).
     */
    @NotNull(message = "targetUserId is required")
    private UUID targetUserId;

    /** The appointment this notification relates to (optional but recommended) */
    private UUID appointmentId;

    @NotNull(message = "event is required")
    private NotificationEvent event;

    /**
     * Flexible key-value map for dynamic email content.
     * Keys used per event are documented in EmailTemplateService.
     */
    private Map<String, String> extraData;
}