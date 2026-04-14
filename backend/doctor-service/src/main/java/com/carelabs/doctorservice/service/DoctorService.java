package com.carelabs.doctorservice.service;

import com.carelabs.doctorservice.entity.*;
import com.carelabs.doctorservice.enums.DocumentType;
import com.carelabs.doctorservice.enums.VerificationStatus;
import com.carelabs.doctorservice.repository.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
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
                .orElseGet(() -> createBaseDoctorProfile(userId));
    }

    private Doctor createBaseDoctorProfile(UUID userId) {
        Doctor doctor = new Doctor();
        doctor.setUserId(userId);
        doctor.setProfileImageUrl("");
        doctor.setConsultationFee(BigDecimal.ZERO);
        doctor.setAverageRating(0.0);
        doctor.setTotalReviews(0);
        doctor.setVerificationStatus(VerificationStatus.PENDING);
        doctor.setActive(false);
        try {
            return doctorRepository.save(doctor);
        } catch (DataIntegrityViolationException ex) {
            return doctorRepository.findByUserId(userId)
                    .orElseThrow(() -> ex);
        }
    }

    public Doctor getDoctorById(UUID id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
    }

    public Doctor updateMyProfile(UUID userId, Doctor updatedData) {
        Doctor existingDoctor = getDoctorByUserId(userId);
        existingDoctor.setFullName(updatedData.getFullName());
        existingDoctor.setSpecialty(updatedData.getSpecialty());
        if (updatedData.getSlmcNumber() != null && !updatedData.getSlmcNumber().trim().isEmpty()) {
            existingDoctor.setSlmcNumber(updatedData.getSlmcNumber().trim());
        }
        existingDoctor.setBio(updatedData.getBio());
        existingDoctor.setExperienceYears(updatedData.getExperienceYears());
        existingDoctor.setConsultationFee(updatedData.getConsultationFee());
        existingDoctor.setQualification(updatedData.getQualification());
        if (updatedData.getProfileImageUrl() != null) {
            existingDoctor.setProfileImageUrl(updatedData.getProfileImageUrl());
        }
        return doctorRepository.save(existingDoctor);
    }

    public Doctor uploadProfileImage(UUID userId, MultipartFile file) {
        Doctor doctor = getDoctorByUserId(userId);

        try {
            var uploadResult = cloudinaryService.uploadFile(file, "carelabs/doctors/profiles/" + doctor.getId());
            doctor.setProfileImageUrl(uploadResult.get("secure_url").toString());
            return doctorRepository.save(doctor);
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload profile image to Cloudinary", e);
        }
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

    public List<DoctorDocument> getDocumentsByDoctorId(UUID doctorId) {
        getDoctorById(doctorId);
        return documentRepository.findByDoctorId(doctorId);
    }

    public List<Doctor> getPendingDoctors() {
        return doctorRepository.findByVerificationStatus(VerificationStatus.PENDING);
    }

    public List<Doctor> getAllDoctorsForAdmin() {
        return doctorRepository.findAll();
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
        Doctor doctor = getDoctorByUserId(userId);
        ensureDoctorApprovedForPublishing(doctor);
        availability.setDoctorId(doctor.getId());
        return availabilityRepository.save(availability);
    }

    public List<Availability> getMyAvailability(UUID userId) {
        UUID doctorId = getDoctorByUserId(userId).getId();
        return availabilityRepository.findByDoctorId(doctorId);
    }

    public List<Availability> getAvailabilityByDoctorId(UUID doctorId) {
        getDoctorById(doctorId);
        return availabilityRepository.findByDoctorId(doctorId);
    }

    public void removeAvailability(UUID userId, UUID availabilityId) {
        availabilityRepository.deleteById(availabilityId);
    }

    public Availability updateAvailability(UUID userId, UUID availabilityId, Availability updateDetails) {
        Doctor doctor = getDoctorByUserId(userId);
        Availability existing = availabilityRepository.findById(availabilityId)
                .orElseThrow(() -> new RuntimeException("Availability slot not found"));
        
        if (!existing.getDoctorId().equals(doctor.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        existing.setDayOfWeek(updateDetails.getDayOfWeek());
        existing.setStartTime(updateDetails.getStartTime());
        existing.setEndTime(updateDetails.getEndTime());
        existing.setSlotDuration(updateDetails.getSlotDuration());
        return availabilityRepository.save(existing);
    }

    public DoctorLeave addLeave(UUID userId, DoctorLeave leave) {
        Doctor doctor = getDoctorByUserId(userId);
        ensureDoctorApprovedForPublishing(doctor);
        leave.setDoctorId(doctor.getId());
        return leaveRepository.save(leave);
    }

    public List<DoctorLeave> getMyLeaves(UUID userId) {
        UUID doctorId = getDoctorByUserId(userId).getId();
        return leaveRepository.findByDoctorId(doctorId);
    }

    public void removeLeave(UUID userId, UUID leaveId) {
        Doctor doctor = getDoctorByUserId(userId);
        DoctorLeave existing = leaveRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave date not found"));
        
        if (!existing.getDoctorId().equals(doctor.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        leaveRepository.deleteById(leaveId);
    }

    public DoctorLeave updateLeave(UUID userId, UUID leaveId, DoctorLeave updateDetails) {
        Doctor doctor = getDoctorByUserId(userId);
        DoctorLeave existing = leaveRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave date not found"));
        
        if (!existing.getDoctorId().equals(doctor.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        existing.setLeaveDate(updateDetails.getLeaveDate());
        existing.setReason(updateDetails.getReason());
        return leaveRepository.save(existing);
    }

    private void ensureDoctorApprovedForPublishing(Doctor doctor) {
        if (doctor.getVerificationStatus() != VerificationStatus.APPROVED || !Boolean.TRUE.equals(doctor.getActive())) {
            throw new RuntimeException("Doctor must be admin-approved before publishing schedule");
        }
    }

    public Doctor verifyDoctor(UUID doctorId, VerificationStatus newStatus, UUID adminUserId, String rejectionReason) {
        Doctor doctor = getDoctorById(doctorId);

        if (newStatus == VerificationStatus.REJECTED && (rejectionReason == null || rejectionReason.trim().isEmpty())) {
            throw new RuntimeException("Rejection reason is required");
        }

        if (newStatus == VerificationStatus.APPROVED) {
            String slmcNumber = doctor.getSlmcNumber();
            if (slmcNumber == null || slmcNumber.trim().isEmpty() || "PENDING".equalsIgnoreCase(slmcNumber.trim())) {
                throw new RuntimeException("Doctor SLMC number must be completed before approval");
            }

            List<DoctorDocument> allDocuments = documentRepository.findByDoctorId(doctorId);
            if (allDocuments.isEmpty()) {
                throw new RuntimeException("At least one verification document is required before approval");
            }
        }

        doctor.setVerificationStatus(newStatus);
        doctor.setActive(newStatus == VerificationStatus.APPROVED);

        List<DoctorDocument> pendingDocuments = documentRepository.findByDoctorIdAndStatus(doctorId, VerificationStatus.PENDING);
        for (DoctorDocument document : pendingDocuments) {
            document.setStatus(newStatus);
            document.setReviewedBy(adminUserId);
            document.setRejectionReason(newStatus == VerificationStatus.REJECTED ? rejectionReason.trim() : null);
        }
        if (!pendingDocuments.isEmpty()) {
            documentRepository.saveAll(pendingDocuments);
        }

        return doctorRepository.save(doctor);
    }
}
