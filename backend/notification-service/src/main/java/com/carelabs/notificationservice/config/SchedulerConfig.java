package com.carelabs.notificationservice.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Enables Spring's @Scheduled annotation support.
 * Required for the 2-hour appointment reminder job in ReminderSchedulerService.
 */
@Configuration
@EnableScheduling
public class SchedulerConfig {
}