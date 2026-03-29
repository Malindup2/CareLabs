package com.carelabs.paymentservice.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class PaymentInitRequest {
    private UUID appointmentId;
    private String patientFirstName;
    private String patientLastName;
    private String patientEmail;
    private String patientPhone;
    private String patientCity;
}
