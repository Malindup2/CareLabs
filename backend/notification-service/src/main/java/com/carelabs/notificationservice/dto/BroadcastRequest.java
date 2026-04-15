package com.carelabs.notificationservice.dto;

import com.carelabs.notificationservice.enums.NotificationEvent;
import com.carelabs.notificationservice.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BroadcastRequest {
    private String title;
    private String message;
    private String targetRole; // ALL, DOCTOR, PATIENT
    private Map<String, String> extraData;
}
