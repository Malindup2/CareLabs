package com.carelabs.patientservice.dto;

import com.carelabs.patientservice.enums.ReportType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalReportResponse {
    private UUID id;
    private UUID patientId;
    private UUID uploadedBy;
    private UUID appointmentId;
    private String fileUrl;
    private String fileName;
    private ReportType type;
}