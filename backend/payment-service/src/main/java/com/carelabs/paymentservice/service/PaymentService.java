package com.carelabs.paymentservice.service;

import com.carelabs.paymentservice.dto.PaymentStatusEvent;
import com.carelabs.paymentservice.dto.PayHereCheckoutResponse;
import com.carelabs.paymentservice.dto.PaymentInitRequest;
import com.carelabs.paymentservice.entity.Payment;
import com.carelabs.paymentservice.enums.PaymentStatus;
import com.carelabs.paymentservice.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.security.MessageDigest;
import java.text.DecimalFormat;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentPricingService paymentPricingService;
    private final PaymentValidationService paymentValidationService;

    @Value("${payhere.merchant-id}")
    private String merchantId;

    @Value("${payhere.merchant-secret}")
    private String merchantSecret;

    @Value("${payhere.currency}")
    private String currency;

    @Value("${payhere.notify-url}")
    private String notifyUrl;

    @Value("${payhere.sandbox:true}")
    private boolean sandboxMode;

    @Value("${app.frontend-base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    private final org.springframework.kafka.core.KafkaTemplate<String, PaymentStatusEvent> kafkaTemplate;

    public PayHereCheckoutResponse initiatePayment(PaymentInitRequest request) {
        log.info("Initiating payment for AppointmentID: {}", request.getAppointmentId());
        
        BigDecimal appointmentFee = paymentValidationService.validateAndResolveAppointmentFee(request.getAppointmentId());

        // Check for existing payment — if patient retries, reuse the same record
        Payment payment = paymentRepository.findByAppointmentId(request.getAppointmentId())
                .orElse(null);

        if (payment != null) {
            log.info("Found existing payment (ID: {}) with status: {}. Resuming checkout.", payment.getId(), payment.getStatus());
        } else {
            log.info("No existing payment found. Creating new PENDING record.");
            BigDecimal totalAmount = paymentPricingService.resolveConsultationFee(appointmentFee);
            BigDecimal platformFee = paymentPricingService.calculatePlatformFee(totalAmount);
            BigDecimal doctorEarning = paymentPricingService.calculateDoctorEarning(totalAmount);

            payment = Payment.builder()
                    .appointmentId(request.getAppointmentId())
                    .amount(totalAmount)
                    .platformFee(platformFee)
                    .doctorEarning(doctorEarning)
                    .status(PaymentStatus.PENDING)
                    .currency(currency)
                    .provider("PAYHERE")
                    .build();
            payment = paymentRepository.save(payment);
        }

        String orderId = payment.getId().toString();

        //Generate the Secure MD5 Hash
        String formattedAmount = new DecimalFormat("0.00").format(payment.getAmount());
        String hash = generatePayHereHash(merchantId, orderId, formattedAmount, currency, merchantSecret);

        //Return the complete package to the React frontend
        return PayHereCheckoutResponse.builder()
                .merchantId(merchantId)
            .returnUrl(frontendBaseUrl + "/patient/appointments")
            .cancelUrl(frontendBaseUrl + "/patient/appointments")
                .notifyUrl(notifyUrl) 
            .checkoutUrl(sandboxMode ? "https://sandbox.payhere.lk/pay/checkout" : "https://www.payhere.lk/pay/checkout")
                .orderId(orderId)
                .items("Medical Consultation")
                .currency(currency)
                .amount(formattedAmount)
                .firstName(request.getPatientFirstName())
                .lastName(request.getPatientLastName())
                .email(request.getPatientEmail())
                .phone(request.getPatientPhone())
                .address("CareLabs Platform")
                .city(request.getPatientCity())
                .country("Sri Lanka")
                .hash(hash)
                .build();
    }

    // PayHere's MD5 Hash Formula: 
    // md5(merchant_id + order_id + amount + currency + md5(merchant_secret))
    private String generatePayHereHash(String merchantId, String orderId, String amount, String currency, String merchantSecret) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            
            // Hash the secret first
            md.update(merchantSecret.getBytes());
            byte[] digestSecret = md.digest();
            StringBuilder sbSecret = new StringBuilder();
            for (byte b : digestSecret) {
                sbSecret.append(String.format("%02x", b).toUpperCase());
            }

            // Combine and hash again
            String hashString = merchantId + orderId + amount + currency + sbSecret.toString();
            md.update(hashString.getBytes());
            byte[] digestFinal = md.digest();
            StringBuilder sbFinal = new StringBuilder();
            for (byte b : digestFinal) {
                sbFinal.append(String.format("%02x", b).toUpperCase());
            }
            
            return sbFinal.toString();
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PayHere hash", e);
        }
    }

    public void handlePayHereWebhook(
            String merchantId, String orderId, String paymentId, String payhereAmount, 
            String payhereCurrency, int statusCode, String md5sig, String method) {
        
        try {
            
            MessageDigest md = MessageDigest.getInstance("MD5");
            md.update(this.merchantSecret.getBytes());
            byte[] digestSecret = md.digest();
            StringBuilder sbSecret = new StringBuilder();
            for (byte b : digestSecret) {
                sbSecret.append(String.format("%02x", b).toUpperCase());
            }

            
            String hashString = this.merchantId + orderId + payhereAmount + payhereCurrency + statusCode + sbSecret.toString();
            md.update(hashString.getBytes());
            byte[] digestFinal = md.digest();
            StringBuilder sbFinal = new StringBuilder();
            for (byte b : digestFinal) {
                sbFinal.append(String.format("%02x", b).toUpperCase());
            }
            String localMd5sig = sbFinal.toString();

            if (!localMd5sig.equalsIgnoreCase(md5sig)) {
                throw new RuntimeException("Signature Failed! Expected: " + localMd5sig + " but got: " + md5sig);
            }

            
            Payment payment = paymentRepository.findById(UUID.fromString(orderId))
                    .orElseThrow(() -> new RuntimeException("Payment Order ID not found: " + orderId));

            if (statusCode == 2) {
                payment.setStatus(PaymentStatus.SUCCESS);
                payment.setTransactionId(paymentId);
                payment.setPaymentMethod(method);
            } else if (statusCode < 0) {
                payment.setStatus(PaymentStatus.FAILED);
            }

            paymentRepository.save(payment);
            
            // Publish Kafka Event
            PaymentStatusEvent event = PaymentStatusEvent.builder()
                    .appointmentId(payment.getAppointmentId())
                    .transactionId(payment.getTransactionId())
                    .status(payment.getStatus().name())
                    .build();
            kafkaTemplate.send("payment-events", event);
            log.info("KAFKA TRAFFIC - Sent PaymentStatusEvent for AppointmentID: {} with status: {}", event.getAppointmentId(), event.getStatus());
            
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }
    }

    public java.util.List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public Payment getPaymentById(UUID id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
    }

    public Payment getPaymentByAppointmentId(UUID appointmentId) {
        return paymentRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new RuntimeException("Payment not found for appointment"));
    }

    public java.util.List<Payment> getPaymentHistory() {
        return paymentRepository.findAll(); 
    }

    public Payment verifyPayment(UUID orderId) {
        return getPaymentById(orderId);
    }

    public Payment refundPayment(UUID id) {
        Payment payment = getPaymentById(id);
        payment.setStatus(PaymentStatus.FAILED); 
        return paymentRepository.save(payment);
    }
}
