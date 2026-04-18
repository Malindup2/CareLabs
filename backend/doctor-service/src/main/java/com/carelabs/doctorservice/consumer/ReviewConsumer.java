package com.carelabs.doctorservice.consumer;

import com.carelabs.doctorservice.dto.ReviewSubmittedEvent;
import com.carelabs.doctorservice.service.DoctorService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class ReviewConsumer {

    private final DoctorService doctorService;

    public ReviewConsumer(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @KafkaListener(topics = "review-events", groupId = "doctor-service-group")
    public void handleReviewSubmitted(ReviewSubmittedEvent event) {
        log.info("Received review submitted event for doctor: {} with rating: {}", event.getDoctorId(), event.getRating());
        try {
            doctorService.updateDoctorRating(event.getDoctorId(), event.getRating());
            log.info("Successfully updated rating for doctor: {}", event.getDoctorId());
        } catch (Exception e) {
            log.error("Failed to update doctor rating for doctor: {}", event.getDoctorId(), e);
        }
    }
}
