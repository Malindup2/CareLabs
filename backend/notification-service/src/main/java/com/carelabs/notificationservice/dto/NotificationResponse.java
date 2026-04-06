package com.carelabs.notificationservice.dto;

import com.carelabs.notificationservice.enums.NotificationEvent;
import com.carelabs.notificationservice.enums.NotificationStatus;
import com.carelabs.notificationservice.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private UUID id;
    private UUID userId;
    private UUID appointmentId;
    private NotificationType type;
    private NotificationEvent event;
    private String title;
    private String message;
    private Boolean read;
    private NotificationStatus status;
    private LocalDateTime createdAt;
}