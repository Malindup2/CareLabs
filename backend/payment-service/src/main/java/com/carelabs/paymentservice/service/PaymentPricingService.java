package com.carelabs.paymentservice.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PaymentPricingService {

    @Value("${pricing.consultation.default-fee:1500.00}")
    private BigDecimal defaultConsultationFee;

    @Value("${pricing.platform-fee-ratio:0.10}")
    private BigDecimal platformFeeRatio;

    public BigDecimal resolveConsultationFee(BigDecimal externalFee) {
        return externalFee != null ? externalFee : defaultConsultationFee;
    }

    public BigDecimal calculatePlatformFee(BigDecimal totalAmount) {
        return totalAmount.multiply(platformFeeRatio).setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal calculateDoctorEarning(BigDecimal totalAmount) {
        return totalAmount.subtract(calculatePlatformFee(totalAmount));
    }
}