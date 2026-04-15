package com.carelabs.notificationservice.repository;

import com.carelabs.notificationservice.entity.Notification;
import com.carelabs.notificationservice.enums.NotificationEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    /** All notifications for a user, newest first */
    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);

    /** Check if a reminder was already sent for a specific appointment + event combo */
    Optional<Notification> findByAppointmentIdAndEvent(UUID appointmentId, NotificationEvent event);

    /** For scheduler: find all sent reminders within a time window (deduplication) */
    boolean existsByAppointmentIdAndEvent(UUID appointmentId, NotificationEvent event);
}