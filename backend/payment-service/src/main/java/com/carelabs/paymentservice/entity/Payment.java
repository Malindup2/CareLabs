package com.carelabs.paymentservice.entity;

import com.carelabs.paymentservice.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID appointmentId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private BigDecimal platformFee; 

    @Column(nullable = false)
    private BigDecimal doctorEarning; 

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    @Column(nullable = false)
    private String provider = "PAYHERE";

    private String paymentMethod;
    
    private String transactionId; 

    @Builder.Default
    private String currency = "LKR";

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
