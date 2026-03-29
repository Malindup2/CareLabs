package com.carelabs.paymentservice.service;

import com.carelabs.paymentservice.dto.PayHereCheckoutResponse;
import com.carelabs.paymentservice.dto.PaymentInitRequest;
import com.carelabs.paymentservice.entity.Payment;
import com.carelabs.paymentservice.enums.PaymentStatus;
import com.carelabs.paymentservice.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.MessageDigest;
import java.text.DecimalFormat;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;

    @Value("${payhere.merchant-id}")
    private String merchantId;

    @Value("${payhere.merchant-secret}")
    private String merchantSecret;

    @Value("${payhere.currency}")
    private String currency;

    @Value("${payhere.notify-url}")
    private String notifyUrl;

    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    public PayHereCheckoutResponse initiatePayment(PaymentInitRequest request) {
        
        BigDecimal totalAmount = new BigDecimal("1500.00");
        BigDecimal platformFee = totalAmount.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal doctorEarning = totalAmount.subtract(platformFee);

        
        Payment payment = Payment.builder()
                .appointmentId(request.getAppointmentId())
                .amount(totalAmount)
                .platformFee(platformFee)
                .doctorEarning(doctorEarning)
                .status(PaymentStatus.PENDING)
                .currency(currency)
                .provider("PAYHERE")
                .build();
        
        payment = paymentRepository.save(payment);
        String orderId = payment.getId().toString();

        //Generate the Secure MD5 Hash
        String formattedAmount = new DecimalFormat("0.00").format(totalAmount);
        String hash = generatePayHereHash(merchantId, orderId, formattedAmount, currency, merchantSecret);

        //Return the complete package to the React frontend
        return PayHereCheckoutResponse.builder()
                .merchantId(merchantId)
                .returnUrl("http://localhost:3000/patient/appointments") 
                .cancelUrl("http://localhost:3000/patient/checkout") 
                .notifyUrl(notifyUrl) 
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
                //added print hash for debugging
                System.out.println("EXPECTED HASH");
                System.out.println(localMd5sig);
                
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
            
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }
    }
}
