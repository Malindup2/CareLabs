package com.carelabs.notificationservice.entity;

import com.carelabs.notificationservice.enums.NotificationEvent;
import com.carelabs.notificationservice.enums.NotificationStatus;
import com.carelabs.notificationservice.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** The user (patient, doctor, or admin) this notification belongs to */
    @Column(nullable = false)
    private UUID userId;

    /** The appointment this notification relates to (nullable for non-appointment events) */
    private UUID appointmentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationEvent event;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    /** Recipient email address (stored for audit trail) */
    private String recipientEmail;

    @Builder.Default
    private Boolean read = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationStatus status;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}