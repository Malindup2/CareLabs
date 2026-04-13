package com.carelabs.appointments.service;

import com.carelabs.appointments.dto.AppointmentBookedEvent;
import com.carelabs.appointments.dto.AppointmentRequest;
import com.carelabs.appointments.dto.ChatMessageRequest;
import com.carelabs.appointments.entity.Appointment;
import com.carelabs.appointments.entity.ChatMessage;
import com.carelabs.appointments.entity.ConsultationNote;
import com.carelabs.appointments.entity.Prescription;
import com.carelabs.appointments.entity.Review;
import com.carelabs.appointments.enums.AppointmentStatus;
import com.carelabs.appointments.repository.AppointmentRepository;
import com.carelabs.appointments.repository.ChatMessageRepository;
import com.carelabs.appointments.repository.ConsultationNoteRepository;
import com.carelabs.appointments.repository.PrescriptionRepository;
import com.carelabs.appointments.repository.ReviewRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ConsultationNoteRepository consultationNoteRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final ReviewRepository reviewRepository;
    private final BookingValidationService bookingValidationService;
    private final ConsultationPricingService consultationPricingService;
    private final org.springframework.kafka.core.KafkaTemplate<String, AppointmentBookedEvent> kafkaTemplate;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              ChatMessageRepository chatMessageRepository,
                              ConsultationNoteRepository consultationNoteRepository,
                              PrescriptionRepository prescriptionRepository,
                              ReviewRepository reviewRepository,
                              BookingValidationService bookingValidationService,
                              ConsultationPricingService consultationPricingService,
                              org.springframework.kafka.core.KafkaTemplate<String, AppointmentBookedEvent> kafkaTemplate) {
        this.appointmentRepository = appointmentRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.consultationNoteRepository = consultationNoteRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.reviewRepository = reviewRepository;
        this.bookingValidationService = bookingValidationService;
        this.consultationPricingService = consultationPricingService;
        this.kafkaTemplate = kafkaTemplate;
    }

    public Appointment bookAppointment(AppointmentRequest request) {
        bookingValidationService.validatePatientExistsAndActive(request.getPatientId());
        bookingValidationService.validateDoctorExistsAndVerified(request.getDoctorId());
        if (!isSlotAvailable(request.getDoctorId(), request.getAppointmentTime())) {
            throw new RuntimeException("Doctor is not available at the requested appointment time.");
        }

        Appointment appointment = new Appointment();
        appointment.setPatientId(request.getPatientId());
        appointment.setDoctorId(request.getDoctorId());
        appointment.setAppointmentTime(request.getAppointmentTime());
        appointment.setType(request.getType());
        appointment.setReason(request.getReason());

        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setDurationMinutes(30);
        appointment.setConsultationFee(consultationPricingService.resolveFee(request.getDoctorId(), request.getType()));

        Appointment savedAppointment = appointmentRepository.save(appointment);

        AppointmentBookedEvent event = AppointmentBookedEvent.builder()
                .appointmentId(savedAppointment.getId())
                .patientId(savedAppointment.getPatientId())
                .doctorId(savedAppointment.getDoctorId())
                .appointmentTime(savedAppointment.getAppointmentTime())
                .consultationFee(savedAppointment.getConsultationFee())
                .build();
        kafkaTemplate.send("appointment-events", event);

        return savedAppointment;
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

    public void deleteAppointment(UUID id) {
        if (!appointmentRepository.existsById(id)) {
            throw new RuntimeException("Appointment not found with ID: " + id);
        }
        appointmentRepository.deleteById(id);
    }

    public Appointment rescheduleAppointment(UUID id, LocalDateTime newTime) {
        Appointment appointment = getAppointmentById(id);

        boolean isDoctorAvailable = isSlotAvailable(appointment.getDoctorId(), newTime);
        if (!isDoctorAvailable) {
            throw new RuntimeException("Doctor is not available at the new time.");
        }

        appointment.setAppointmentTime(newTime);
        return appointmentRepository.save(appointment);
    }

    public List<LocalTime> getAvailableSlots(UUID doctorId, LocalDate date) {
        List<LocalTime> candidateSlots = List.of(
                LocalTime.of(9, 0),
                LocalTime.of(9, 30),
                LocalTime.of(10, 0),
                LocalTime.of(14, 0),
                LocalTime.of(14, 30)
        );

        return candidateSlots.stream()
                .filter(slot -> isSlotAvailable(doctorId, LocalDateTime.of(date, slot)))
                .toList();
    }

    private boolean isSlotAvailable(UUID doctorId, LocalDateTime time) {
        List<AppointmentStatus> nonBlockingStatuses = List.of(
                AppointmentStatus.CANCELLED,
                AppointmentStatus.REJECTED
        );
        return !appointmentRepository.existsByDoctorIdAndAppointmentTimeAndStatusNotIn(
                doctorId,
                time,
                nonBlockingStatuses
        );
    }

    public String getMeetingLink(UUID appointmentId) {
        Appointment appointment = getAppointmentById(appointmentId);

        if (appointment.getType() != com.carelabs.appointments.enums.AppointmentType.TELEMEDICINE) {
            throw new RuntimeException("This is an in-clinic appointment. No video link available.");
        }

        return "https://meet.jit.si/CareLabs-Consultation-" + appointmentId;
    }

    public ChatMessage saveChatMessage(UUID appointmentId, ChatMessageRequest request) {
        getAppointmentById(appointmentId);

        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setAppointmentId(appointmentId);
        chatMessage.setSenderId(request.getSenderId());
        chatMessage.setMessage(request.getMessage());
        chatMessage.setSentAt(LocalDateTime.now());

        return chatMessageRepository.save(chatMessage);
    }

    public List<ChatMessage> getChatHistory(UUID appointmentId) {
        return chatMessageRepository.findByAppointmentIdOrderBySentAtAsc(appointmentId);
    }

    public ConsultationNote saveNote(UUID appointmentId, ConsultationNote note) {
        getAppointmentById(appointmentId);
        return consultationNoteRepository.save(note);
    }

    public ConsultationNote getNote(UUID appointmentId) {
        return consultationNoteRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new RuntimeException("No notes found for this appointment"));
    }

    public Prescription savePrescription(UUID appointmentId, Prescription prescription) {
        getAppointmentById(appointmentId);
        prescription.setAppointmentId(appointmentId);
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
