package com.carelabs.doctorservice.service;

import com.carelabs.doctorservice.entity.*;
import com.carelabs.doctorservice.enums.DocumentType;
import com.carelabs.doctorservice.enums.VerificationStatus;
import com.carelabs.doctorservice.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final AvailabilityRepository availabilityRepository;
    private final DoctorDocumentRepository documentRepository;
    private final DoctorLeaveRepository leaveRepository;
    private final CloudinaryService cloudinaryService;

    public DoctorService(DoctorRepository doctorRepository, 
                         AvailabilityRepository availabilityRepository,
                         DoctorDocumentRepository documentRepository,
                         DoctorLeaveRepository leaveRepository,
                         CloudinaryService cloudinaryService) {
        this.doctorRepository = doctorRepository;
        this.availabilityRepository = availabilityRepository;
        this.documentRepository = documentRepository;
        this.leaveRepository = leaveRepository;
        this.cloudinaryService = cloudinaryService;
    }

    public Doctor getDoctorByUserId(UUID userId) {
        return doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Doctor profile not found"));
    }

    public Doctor getDoctorById(UUID id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
    }

    public Doctor updateMyProfile(UUID userId, Doctor updatedData) {
        Doctor existingDoctor = getDoctorByUserId(userId);
        existingDoctor.setFullName(updatedData.getFullName());
        existingDoctor.setSpecialty(updatedData.getSpecialty());
        existingDoctor.setBio(updatedData.getBio());
        existingDoctor.setExperienceYears(updatedData.getExperienceYears());
        existingDoctor.setConsultationFee(updatedData.getConsultationFee());
        existingDoctor.setQualification(updatedData.getQualification());
        return doctorRepository.save(existingDoctor);
    }

    public List<Doctor> searchDoctors(String specialty) {
        if (specialty != null && !specialty.trim().isEmpty()) {
            return doctorRepository.findByVerificationStatusAndActiveTrueAndSpecialtyContainingIgnoreCase(
                    VerificationStatus.APPROVED, specialty);
        }
        return doctorRepository.findByVerificationStatusAndActiveTrue(VerificationStatus.APPROVED);
    }

    public DoctorDocument uploadDocument(UUID userId, MultipartFile file, DocumentType type) {
        Doctor doctor = getDoctorByUserId(userId);
        
        try {
            var uploadResult = cloudinaryService.uploadFile(file, "carelabs/doctors/documents/" + doctor.getId());
            
            DoctorDocument document = new DoctorDocument();
            document.setDoctorId(doctor.getId());
            document.setDocumentUrl(uploadResult.get("secure_url").toString());
            document.setPublicId(uploadResult.get("public_id").toString());
            document.setType(type);
            document.setStatus(VerificationStatus.PENDING);
            return documentRepository.save(document);
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload document to Cloudinary", e);
        }
    }

    public List<DoctorDocument> getMyDocuments(UUID userId) {
        return documentRepository.findByDoctorId(getDoctorByUserId(userId).getId());
    }

    public void deleteDocument(UUID userId, UUID documentId) {
        Doctor doctor = getDoctorByUserId(userId);
        DoctorDocument doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        
        if (!doc.getDoctorId().equals(doctor.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        try {
            if (doc.getPublicId() != null) {
                cloudinaryService.deleteFile(doc.getPublicId());
            }
            documentRepository.deleteById(documentId);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete document from Cloudinary", e);
        }
    }

    public Availability addAvailability(UUID userId, Availability availability) {
        availability.setDoctorId(getDoctorByUserId(userId).getId());
        return availabilityRepository.save(availability);
    }

    public void removeAvailability(UUID userId, UUID availabilityId) {
        availabilityRepository.deleteById(availabilityId);
    }

    public DoctorLeave addLeave(UUID userId, DoctorLeave leave) {
        leave.setDoctorId(getDoctorByUserId(userId).getId());
        return leaveRepository.save(leave);
    }

    public Doctor verifyDoctor(UUID doctorId, VerificationStatus newStatus) {
        Doctor doctor = getDoctorById(doctorId);
        doctor.setVerificationStatus(newStatus);
        if (newStatus == VerificationStatus.APPROVED) doctor.setActive(true);
        return doctorRepository.save(doctor);
    }
}
