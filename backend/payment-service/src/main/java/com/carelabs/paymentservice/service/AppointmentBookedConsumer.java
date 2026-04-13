package com.carelabs.paymentservice.service;

import com.carelabs.paymentservice.dto.AppointmentBookedEvent;
import com.carelabs.paymentservice.entity.Payment;
import com.carelabs.paymentservice.enums.PaymentStatus;
import com.carelabs.paymentservice.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentBookedConsumer {

    private final PaymentRepository paymentRepository;
    private final PaymentPricingService paymentPricingService;

    @KafkaListener(topics = "appointment-events", groupId = "payment-service-group")
    public void consume(AppointmentBookedEvent event) {
        log.info("Received AppointmentBookedEvent: {}", event);

        if (paymentRepository.findByAppointmentId(event.getAppointmentId()).isPresent()) {
            log.info("Payment record already exists for appointmentId: {}", event.getAppointmentId());
            return;
        }

        BigDecimal totalAmount = paymentPricingService.resolveConsultationFee(event.getConsultationFee());
        BigDecimal platformFee = paymentPricingService.calculatePlatformFee(totalAmount);
        BigDecimal doctorEarning = paymentPricingService.calculateDoctorEarning(totalAmount);

        Payment payment = Payment.builder()
                .appointmentId(event.getAppointmentId())
                .amount(totalAmount)
                .platformFee(platformFee)
                .doctorEarning(doctorEarning)
                .status(PaymentStatus.PENDING)
                .provider("PAYHERE")
                .currency("LKR")
                .build();

        paymentRepository.save(payment);
        log.info("Created pending payment for appointmentId: {}", event.getAppointmentId());
    }
}
