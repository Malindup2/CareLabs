package com.carelabs.appointments.service;

import com.carelabs.appointments.enums.AppointmentType;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ConsultationPricingService {

    private final DoctorFeeLookupService doctorFeeLookupService;

    public ConsultationPricingService(DoctorFeeLookupService doctorFeeLookupService) {
        this.doctorFeeLookupService = doctorFeeLookupService;
    }

    @Value("${pricing.consultation.default-fee:1500.00}")
    private BigDecimal defaultFee;

    @Value("${pricing.consultation.in-clinic-fee:1500.00}")
    private BigDecimal inClinicFee;

    @Value("${pricing.consultation.telemedicine-fee:1200.00}")
    private BigDecimal telemedicineFee;

    public BigDecimal resolveFee(UUID doctorId, AppointmentType appointmentType) {
        BigDecimal doctorConfiguredFee = doctorFeeLookupService.findDoctorConsultationFee(doctorId);
        if (doctorConfiguredFee != null && doctorConfiguredFee.signum() > 0) {
            return doctorConfiguredFee;
        }

        if (appointmentType == null) {
            return defaultFee;
        }

        return switch (appointmentType) {
            case IN_CLINIC -> inClinicFee;
            case TELEMEDICINE -> telemedicineFee;
        };
    }
}