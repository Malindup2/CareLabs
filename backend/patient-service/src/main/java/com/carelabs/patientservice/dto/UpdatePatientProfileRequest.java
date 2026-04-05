package com.carelabs.patientservice.dto;

import com.carelabs.patientservice.enums.Gender;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePatientProfileRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String phone;
    private LocalDate dateOfBirth;
    private Gender gender;

    private String addressLine1;
    private String city;
    private String district;
}