package com.carelabs.appointments.service;

import com.carelabs.appointments.dto.AppointmentRequest;
import com.carelabs.appointments.dto.ChatMessageRequest;
import com.carelabs.appointments.entity.Appointment;
import com.carelabs.appointments.entity.ChatMessage;
import com.carelabs.appointments.enums.AppointmentStatus;
import com.carelabs.appointments.repository.AppointmentRepository;
import com.carelabs.appointments.repository.ChatMessageRepository;
import com.carelabs.appointments.repository.ConsultationNoteRepository;
import com.carelabs.appointments.repository.PrescriptionRepository;
import com.carelabs.appointments.repository.ReviewRepository;
import org.springframework.stereotype.Service;

import com.carelabs.appointments.entity.ConsultationNote;
import com.carelabs.appointments.entity.Prescription;
import com.carelabs.appointments.entity.Review;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ConsultationNoteRepository consultationNoteRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final ReviewRepository reviewRepository;

    public AppointmentService(AppointmentRepository appointmentRepository, 
                              ChatMessageRepository chatMessageRepository,
                              ConsultationNoteRepository consultationNoteRepository,
                              PrescriptionRepository prescriptionRepository,
                              ReviewRepository reviewRepository) {
        this.appointmentRepository = appointmentRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.consultationNoteRepository = consultationNoteRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.reviewRepository = reviewRepository;
    }

    public Appointment bookAppointment(AppointmentRequest request) {
        // Create the new appointment
        Appointment appointment = new Appointment();
        appointment.setPatientId(request.getPatientId());
        appointment.setDoctorId(request.getDoctorId());
        appointment.setAppointmentTime(request.getAppointmentTime());
        appointment.setType(request.getType());
        appointment.setReason(request.getReason());
        
        // Set the system defaults for a brand new booking
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setDurationMinutes(30);
        appointment.setConsultationFee(new BigDecimal("1500.00")); //Hardcoded here for test

        // Save to the database
        return appointmentRepository.save(appointment);
    }

    public List<Appointment> getAppointmentsByPatient(UUID patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    public List<Appointment> getAppointmentsByDoctor(UUID doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    public Appointment getAppointmentById(UUID id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
    }

    public Appointment updateAppointmentStatus(UUID id, AppointmentStatus newStatus) {
        Appointment appointment = getAppointmentById(id);
        appointment.setStatus(newStatus);
        return appointmentRepository.save(appointment);
    }

    //Cancel an appointment
    public void deleteAppointment(UUID id) {
        if (!appointmentRepository.existsById(id)) {
            throw new RuntimeException("Appointment not found with ID: " + id);
        }
        appointmentRepository.deleteById(id);
    }

    //Reschedule an appointment
    public Appointment rescheduleAppointment(UUID id, java.time.LocalDateTime newTime) {
        Appointment appointment = getAppointmentById(id);
        
        // Check if the new time is available (STUBB)
        boolean isDoctorAvailable = checkDoctorAvailabilityStub(appointment.getDoctorId(), newTime);
        if (!isDoctorAvailable) {
            throw new RuntimeException("Doctor is not available at the new time.");
        }

        appointment.setAppointmentTime(newTime);
        return appointmentRepository.save(appointment);
    }

    //Get available slots (STUBBED)
    public List<java.time.LocalTime> getAvailableSlots(UUID doctorId, java.time.LocalDate date) {
        //will return dummy available slots(just untill doc service)
        
        return List.of(
                java.time.LocalTime.of(9, 0),
                java.time.LocalTime.of(9, 30),
                java.time.LocalTime.of(10, 0),
                java.time.LocalTime.of(14, 0),
                java.time.LocalTime.of(14, 30)
        );
    }

    //Helper stub for availability check
    private boolean checkDoctorAvailabilityStub(UUID doctorId, java.time.LocalDateTime time) {
       
        return true;
    }

    
    public String getMeetingLink(UUID appointmentId) {
        Appointment appointment = getAppointmentById(appointmentId);
        
        if (appointment.getType() != com.carelabs.appointments.enums.AppointmentType.TELEMEDICINE) {
            throw new RuntimeException("This is an in-clinic appointment. No video link available.");
        }
        
        return "https://meet.jit.si/CareLabs-Consultation-" + appointmentId.toString();
    }

    //Save a new chat message
    public ChatMessage saveChatMessage(UUID appointmentId, ChatMessageRequest request) {
        
        getAppointmentById(appointmentId); 

        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setAppointmentId(appointmentId);
        chatMessage.setSenderId(request.getSenderId());
        chatMessage.setMessage(request.getMessage());
        chatMessage.setSentAt(java.time.LocalDateTime.now());

        return chatMessageRepository.save(chatMessage);
    }

    // Get Chat History
    public List<ChatMessage> getChatHistory(UUID appointmentId) {
        return chatMessageRepository.findByAppointmentIdOrderBySentAtAsc(appointmentId);
    }

    public ConsultationNote saveNote(UUID appointmentId, ConsultationNote note) {
        getAppointmentById(appointmentId); // Verify
        return consultationNoteRepository.save(note); 
    }

    public ConsultationNote getNote(UUID appointmentId) {
        return consultationNoteRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new RuntimeException("No notes found for this appointment"));
    }

    public Prescription savePrescription(UUID appointmentId, Prescription prescription) {
        getAppointmentById(appointmentId); 
        prescription.setAppointmentId(appointmentId);
        // Link the items to the parent prescription before saving
        if (prescription.getItems() != null) {
            prescription.getItems().forEach(item -> item.setPrescription(prescription));
        }
        return prescriptionRepository.save(prescription); 
    }

    public Prescription getPrescription(UUID appointmentId) {
        return prescriptionRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new RuntimeException("No prescription found for this appointment"));
    }

    public Review saveReview(UUID appointmentId, Review review) {
        getAppointmentById(appointmentId);
        review.setAppointmentId(appointmentId);
        return reviewRepository.save(review); 
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }
}
