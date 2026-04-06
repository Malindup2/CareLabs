package com.carelabs.notificationservice.controller;

import com.carelabs.notificationservice.dto.NotificationRequest;
import com.carelabs.notificationservice.dto.NotificationResponse;
import com.carelabs.notificationservice.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Internal trigger — called by other microservices (appointment, payment, etc.)
     * POST /notifications
     */
    @PostMapping
    public ResponseEntity<NotificationResponse> triggerNotification(
            @Valid @RequestBody NotificationRequest request) {
        return ResponseEntity.ok(notificationService.processNotification(request));
    }

    /**
     * Get notification history for a user.
     * GET /notifications?userId={uuid}
     */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @RequestParam UUID userId) {
        return ResponseEntity.ok(notificationService.getNotificationsForUser(userId));
    }

    /**
     * Mark a notification as read.
     * PUT /notifications/{id}/read
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable UUID id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }
}