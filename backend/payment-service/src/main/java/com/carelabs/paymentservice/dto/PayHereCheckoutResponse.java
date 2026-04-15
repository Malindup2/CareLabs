package com.carelabs.paymentservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PayHereCheckoutResponse {
    
    private String merchantId;
    private String returnUrl;
    private String cancelUrl;
    private String notifyUrl;
    private String checkoutUrl;
    private String orderId;
    private String items;
    private String currency;
    private String amount;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String address;
    private String city;
    private String country;
    private String hash; 
}
