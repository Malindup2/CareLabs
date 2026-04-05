package com.carelabs.patientservice.service;

import com.carelabs.patientservice.dto.CreatePatientAllergyRequest;
import com.carelabs.patientservice.dto.MedicalHistoryResponse;
import com.carelabs.patientservice.dto.MedicalReportResponse;
import com.carelabs.patientservice.dto.PatientAllergyResponse;
import com.carelabs.patientservice.dto.PatientProfileResponse;
import com.carelabs.patientservice.dto.SymptomCheckResponse;
import com.carelabs.patientservice.dto.UpdatePatientAllergyRequest;
import com.carelabs.patientservice.dto.UpdatePatientProfileRequest;
import com.carelabs.patientservice.entity.MedicalReport;
import com.carelabs.patientservice.entity.Patient;
import com.carelabs.patientservice.entity.PatientAllergy;
import com.carelabs.patientservice.entity.SymptomCheck;
import com.carelabs.patientservice.enums.ReportType;
import com.carelabs.patientservice.exception.ResourceNotFoundException;
import com.carelabs.patientservice.repository.MedicalReportRepository;
import com.carelabs.patientservice.repository.PatientAllergyRepository;
import com.carelabs.patientservice.repository.PatientRepository;
import com.carelabs.patientservice.repository.SymptomCheckRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final MedicalReportRepository medicalReportRepository;
    private final PatientAllergyRepository patientAllergyRepository;
    private final SymptomCheckRepository symptomCheckRepository;
    private final CloudinaryService cloudinaryService;

    public PatientService(PatientRepository patientRepository,
                          MedicalReportRepository medicalReportRepository,
                          PatientAllergyRepository patientAllergyRepository,
                          SymptomCheckRepository symptomCheckRepository,
                          CloudinaryService cloudinaryService) {
        this.patientRepository = patientRepository;
        this.medicalReportRepository = medicalReportRepository;
        this.patientAllergyRepository = patientAllergyRepository;
        this.symptomCheckRepository = symptomCheckRepository;
        this.cloudinaryService = cloudinaryService;
    }

    public PatientProfileResponse getMyProfile(UUID userId) {
        Patient patient = patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        return mapToPatientProfileResponse(patient);
    }

    public PatientProfileResponse updateMyProfile(UUID userId, UpdatePatientProfileRequest request) {
        Patient patient = patientRepository.findByUserId(userId).orElse(new Patient());

        if (patient.getId() == null) {
            patient.setUserId(userId);
        }

        patient.setFullName(request.getFullName());
        patient.setPhone(request.getPhone());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setGender(request.getGender());
        patient.setAddressLine1(request.getAddressLine1());
        patient.setCity(request.getCity());
        patient.setDistrict(request.getDistrict());

        Patient savedPatient = patientRepository.save(patient);
        return mapToPatientProfileResponse(savedPatient);
    }

    public MedicalReportResponse uploadReport(UUID userId,
                                              MultipartFile file,
                                              ReportType type,
                                              UUID appointmentId) {
        patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        try {
            Map uploadResult = cloudinaryService.uploadFile(file, "medical-reports");

            String fileUrl = uploadResult.get("secure_url").toString();
            String publicId = uploadResult.get("public_id").toString();

            MedicalReport report = new MedicalReport();
            report.setPatientId(userId);
            report.setUploadedBy(userId);
            report.setAppointmentId(appointmentId);
            report.setFileUrl(fileUrl);
            report.setFileName(file.getOriginalFilename());
            report.setType(type);
            report.setPublicId(publicId);

            MedicalReport saved = medicalReportRepository.save(report);
            return mapToMedicalReportResponse(saved);

        } catch (IOException e) {
            throw new RuntimeException("File upload failed", e);
        }
    }

    public List<MedicalReportResponse> getMyReports(UUID userId) {
        patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        return medicalReportRepository.findByPatientId(userId)
                .stream()
                .map(this::mapToMedicalReportResponse)
                .toList();
    }

    public MedicalReportResponse getMyReportById(UUID userId, UUID reportId) {
        patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        MedicalReport report = medicalReportRepository.findByIdAndPatientId(reportId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));

        return mapToMedicalReportResponse(report);
    }

    public void deleteMyReport(UUID userId, UUID reportId) {
        patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        MedicalReport report = medicalReportRepository.findByIdAndPatientId(reportId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));

        try {
            cloudinaryService.deleteFile(report.getPublicId());
            medicalReportRepository.delete(report);
        } catch (IOException e) {
            throw new RuntimeException("Delete failed", e);
        }
    }

    public PatientAllergyResponse createMyAllergy(UUID userId, CreatePatientAllergyRequest request) {
        patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        PatientAllergy allergy = new PatientAllergy();
        allergy.setPatientId(userId);
        allergy.setAllergen(request.getAllergen());
        allergy.setType(request.getType());
        allergy.setSeverity(request.getSeverity());
        allergy.setReaction(request.getReaction());

        PatientAllergy saved = patientAllergyRepository.save(allergy);
        return mapToPatientAllergyResponse(saved);
    }

    public List<PatientAllergyResponse> getMyAllergies(UUID userId) {
        patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        return patientAllergyRepository.findByPatientId(userId)
                .stream()
                .map(this::mapToPatientAllergyResponse)
                .toList();
    }

    public PatientAllergyResponse updateMyAllergy(UUID userId, UUID allergyId, UpdatePatientAllergyRequest request) {
        patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        PatientAllergy allergy = patientAllergyRepository.findByIdAndPatientId(allergyId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Allergy not found"));

        allergy.setAllergen(request.getAllergen());
        allergy.setType(request.getType());
        allergy.setSeverity(request.getSeverity());
        allergy.setReaction(request.getReaction());

        PatientAllergy saved = patientAllergyRepository.save(allergy);
        return mapToPatientAllergyResponse(saved);
    }

    public void deleteMyAllergy(UUID userId, UUID allergyId) {
        patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        PatientAllergy allergy = patientAllergyRepository.findByIdAndPatientId(allergyId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Allergy not found"));

        patientAllergyRepository.delete(allergy);
    }

    public MedicalHistoryResponse getMedicalHistory(UUID userId) {
        Patient patient = patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        List<PatientAllergyResponse> allergies = patientAllergyRepository.findByPatientId(userId)
                .stream()
                .map(this::mapToPatientAllergyResponse)
                .toList();

        List<MedicalReportResponse> reports = medicalReportRepository.findByPatientId(userId)
                .stream()
                .map(this::mapToMedicalReportResponse)
                .toList();

        List<SymptomCheckResponse> symptomChecks = symptomCheckRepository.findByPatientId(userId)
                .stream()
                .map(this::mapToSymptomCheckResponse)
                .toList();

        return MedicalHistoryResponse.builder()
                .profile(mapToPatientProfileResponse(patient))
                .allergies(allergies)
                .reports(reports)
                .symptomChecks(symptomChecks)
                .build();
    }

    private PatientProfileResponse mapToPatientProfileResponse(Patient patient) {
        return PatientProfileResponse.builder()
                .id(patient.getId())
                .userId(patient.getUserId())
                .fullName(patient.getFullName())
                .phone(patient.getPhone())
                .dateOfBirth(patient.getDateOfBirth())
                .gender(patient.getGender())
                .addressLine1(patient.getAddressLine1())
                .city(patient.getCity())
                .district(patient.getDistrict())
                .build();
    }

    private MedicalReportResponse mapToMedicalReportResponse(MedicalReport report) {
        return MedicalReportResponse.builder()
                .id(report.getId())
                .patientId(report.getPatientId())
                .uploadedBy(report.getUploadedBy())
                .appointmentId(report.getAppointmentId())
                .fileUrl(report.getFileUrl())
                .fileName(report.getFileName())
                .type(report.getType())
                .build();
    }

    private PatientAllergyResponse mapToPatientAllergyResponse(PatientAllergy allergy) {
        return PatientAllergyResponse.builder()
                .id(allergy.getId())
                .allergen(allergy.getAllergen())
                .type(allergy.getType())
                .severity(allergy.getSeverity())
                .reaction(allergy.getReaction())
                .build();
    }

    private SymptomCheckResponse mapToSymptomCheckResponse(SymptomCheck symptomCheck) {
        return SymptomCheckResponse.builder()
                .id(symptomCheck.getId())
                .symptoms(symptomCheck.getSymptoms())
                .result(symptomCheck.getResult())
                .recommendedSpecialty(symptomCheck.getRecommendedSpecialty())
                .confidenceScore(symptomCheck.getConfidenceScore())
                .build();
    }
}