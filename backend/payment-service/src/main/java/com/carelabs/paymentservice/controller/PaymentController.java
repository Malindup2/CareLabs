package com.carelabs.paymentservice.controller;

import com.carelabs.paymentservice.dto.PayHereCheckoutResponse;
import com.carelabs.paymentservice.dto.PaymentInitRequest;
import com.carelabs.paymentservice.service.PaymentService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    
    @PostMapping("/initiate")
    public ResponseEntity<PayHereCheckoutResponse> initiatePayment(@RequestBody PaymentInitRequest request) {
        return ResponseEntity.ok(paymentService.initiatePayment(request));
    }

    
    @PostMapping(value = "/notify", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<String> handlePayHereNotification(
            @RequestParam("merchant_id") String merchantId,
            @RequestParam("order_id") String orderId,
            @RequestParam("payment_id") String paymentId,
            @RequestParam("payhere_amount") String payhereAmount,
            @RequestParam("payhere_currency") String payhereCurrency,
            @RequestParam("status_code") int statusCode,
            @RequestParam("md5sig") String md5sig,
            @RequestParam(value = "method", required = false) String method) {
        
        try {
            paymentService.handlePayHereWebhook(
                    merchantId, orderId, paymentId, payhereAmount, payhereCurrency, statusCode, md5sig, method
            );
            return ResponseEntity.ok("OK"); 
        } catch (Exception e) {
            // Log the error 
            return ResponseEntity.badRequest().body("Webhook processing failed.");
        }
    }
}
