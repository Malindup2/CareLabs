package com.carelabs.notificationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentLookupDto {
    private UUID id;
    private UUID appointmentId;
    private BigDecimal amount;
    private String status;
    private String paymentMethod;
    private String transactionId;
    private String currency;
}
