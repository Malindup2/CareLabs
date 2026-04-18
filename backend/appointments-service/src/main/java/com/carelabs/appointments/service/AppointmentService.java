package com.carelabs.appointments.service;

import com.carelabs.appointments.dto.AppointmentBookedEvent;
import com.carelabs.appointments.dto.ReviewSubmittedEvent;
import com.carelabs.appointments.dto.DoctorAvailabilityView;
import com.carelabs.appointments.dto.DoctorSlotAllocationItem;
import com.carelabs.appointments.dto.AppointmentRequest;
import com.carelabs.appointments.dto.AppointmentResponse;
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
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
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
    private final DoctorScheduleLookupService doctorScheduleLookupService;
    private final org.springframework.kafka.core.KafkaTemplate<String, Object> kafkaTemplate;

    public AppointmentService(AppointmentRepository appointmentRepository,
                              ChatMessageRepository chatMessageRepository,
                              ConsultationNoteRepository consultationNoteRepository,
                              PrescriptionRepository prescriptionRepository,
                              ReviewRepository reviewRepository,
                              BookingValidationService bookingValidationService,
                              ConsultationPricingService consultationPricingService,
                              DoctorScheduleLookupService doctorScheduleLookupService,
                              org.springframework.kafka.core.KafkaTemplate<String, Object> kafkaTemplate) {
        this.appointmentRepository = appointmentRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.consultationNoteRepository = consultationNoteRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.reviewRepository = reviewRepository;
        this.bookingValidationService = bookingValidationService;
        this.consultationPricingService = consultationPricingService;
        this.doctorScheduleLookupService = doctorScheduleLookupService;
        this.kafkaTemplate = kafkaTemplate;
    }

    public Appointment bookAppointment(AppointmentRequest request) {
        bookingValidationService.validatePatientExistsAndActive(request.getPatientId());
        bookingValidationService.validateDoctorExistsAndVerified(request.getDoctorId());

        List<LocalTime> availableSlots = getAvailableSlots(request.getDoctorId(), request.getAppointmentTime().toLocalDate());
        if (!availableSlots.contains(request.getAppointmentTime().toLocalTime())) {
            throw new RuntimeException("Requested time is not in doctor's published schedule.");
        }

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
        appointment.setDurationMinutes(resolveSlotDuration(request.getDoctorId(), request.getAppointmentTime()));
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

    public List<AppointmentResponse> getAppointmentsByPatient(UUID patientId) {
        return appointmentRepository.findByPatientId(patientId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<AppointmentResponse> getAppointmentsByDoctor(UUID doctorId) {
        List<Appointment> appointments = appointmentRepository.findByDoctorId(doctorId);
        return appointments.stream()
                .map(this::mapToResponse)
                .toList();
    }

    private AppointmentResponse mapToResponse(Appointment a) {
        return AppointmentResponse.builder()
                .id(a.getId())
                .patientId(a.getPatientId())
                .patientFullName(bookingValidationService.getPatientFullName(a.getPatientId()))
                .patientDob(bookingValidationService.getPatientDob(a.getPatientId()))
                .doctorId(a.getDoctorId())
                .doctorFullName(bookingValidationService.getDoctorFullName(a.getDoctorId()))
                .doctorSpecialty(bookingValidationService.getDoctorSpecialty(a.getDoctorId()))
                .doctorQualification(bookingValidationService.getDoctorQualification(a.getDoctorId()))
                .appointmentTime(a.getAppointmentTime())
                .durationMinutes(a.getDurationMinutes())
                .status(a.getStatus())
                .type(a.getType())
                .reason(a.getReason())
                .consultationFee(a.getConsultationFee())
                .meetingLink(a.getMeetingLink())
                .build();
    }

    public Appointment getAppointmentById(UUID id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
    }

    public Appointment updateAppointmentStatus(UUID id, AppointmentStatus newStatus) {
        Appointment appointment = getAppointmentById(id);
        AppointmentStatus currentStatus = appointment.getStatus();

        // Enforce the flow: PENDING -> CONFIRMED -> ACCEPTED -> COMPLETED
        validateStatusTransition(currentStatus, newStatus);

        appointment.setStatus(newStatus);
        return appointmentRepository.save(appointment);
    }

    private void validateStatusTransition(AppointmentStatus current, AppointmentStatus target) {
        if (current == target) return;

        switch (target) {
            case CONFIRMED:
                if (current != AppointmentStatus.PENDING) {
                    throw new RuntimeException("Appointment can only be confirmed from PENDING status.");
                }
                break;
            case ACCEPTED:
                if (current != AppointmentStatus.CONFIRMED) {
                    throw new RuntimeException("Appointment must be CONFIRMED before it can be ACCEPTED.");
                }
                break;
            case COMPLETED:
                if (current != AppointmentStatus.ACCEPTED) {
                    throw new RuntimeException("Appointment must be ACCEPTED before it can be COMPLETED.");
                }
                break;
            case REJECTED:
                if (current != AppointmentStatus.CONFIRMED && current != AppointmentStatus.PENDING) {
                    throw new RuntimeException("Only PENDING or CONFIRMED appointments can be REJECTED.");
                }
                break;
            case CANCELLED:
                if (current == AppointmentStatus.COMPLETED) {
                    throw new RuntimeException("Cannot cancel a COMPLETED appointment.");
                }
                break;
            case NO_SHOW:
                if (current != AppointmentStatus.ACCEPTED) {
                    throw new RuntimeException("Only ACCEPTED appointments can be marked as NO_SHOW.");
                }
                break;
            default:
                break;
        }
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
        LocalDateTime now = LocalDateTime.now();
        return buildScheduleSlotsForDate(doctorId, date).stream()
            .filter(slot -> LocalDateTime.of(date, slot).isAfter(now))
                .filter(slot -> isSlotAvailable(doctorId, LocalDateTime.of(date, slot)))
                .toList();
    }

        public List<DoctorSlotAllocationItem> getDoctorDailySlotAllocation(UUID doctorId, LocalDate date) {
        List<LocalTime> allSlots = buildScheduleSlotsForDate(doctorId, date);
        if (allSlots.isEmpty()) {
            return List.of();
        }

        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay().minusNanos(1);
        Map<LocalTime, Appointment> appointmentByTime = appointmentRepository
            .findByDoctorIdAndAppointmentTimeBetween(doctorId, dayStart, dayEnd)
            .stream()
            .collect(Collectors.toMap(
                a -> a.getAppointmentTime().toLocalTime(),
                Function.identity(),
                (first, second) -> first
            ));

        return allSlots.stream().map(slot -> {
            Appointment a = appointmentByTime.get(slot);
            boolean booked = a != null && a.getStatus() != AppointmentStatus.CANCELLED && a.getStatus() != AppointmentStatus.REJECTED;
            return DoctorSlotAllocationItem.builder()
                .slotTime(slot)
                .booked(booked)
                .appointmentId(booked ? a.getId() : null)
                .patientId(booked ? a.getPatientId() : null)
                .appointmentStatus(booked ? a.getStatus() : null)
                .appointmentType(booked ? a.getType() : null)
                .reason(booked ? a.getReason() : null)
                .build();
        }).toList();
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

    private List<LocalTime> buildScheduleSlotsForDate(UUID doctorId, LocalDate date) {
        var availabilities = doctorScheduleLookupService.getDoctorAvailability(doctorId).stream()
                .filter(a -> a.getDayOfWeek() == date.getDayOfWeek())
                .toList();

        return availabilities.stream()
                .flatMap(a -> buildSlotsFromAvailability(a).stream())
                .distinct()
                .sorted()
                .toList();
    }

    private List<LocalTime> buildSlotsFromAvailability(DoctorAvailabilityView availability) {
        if (availability.getStartTime() == null || availability.getEndTime() == null) {
            return List.of();
        }
        int duration = availability.getSlotDuration() != null && availability.getSlotDuration() > 0
                ? availability.getSlotDuration()
                : 30;

        List<LocalTime> slots = new java.util.ArrayList<>();
        LocalTime current = availability.getStartTime();
        LocalTime end = availability.getEndTime();
        while (!current.plusMinutes(duration).isAfter(end)) {
            slots.add(current);
            current = current.plusMinutes(duration);
        }
        return slots;
    }

    private int resolveSlotDuration(UUID doctorId, LocalDateTime appointmentTime) {
        return doctorScheduleLookupService.getDoctorAvailability(doctorId).stream()
                .filter(a -> a.getDayOfWeek() == appointmentTime.getDayOfWeek())
                .filter(a -> a.getStartTime() != null && a.getEndTime() != null)
                .filter(a -> !appointmentTime.toLocalTime().isBefore(a.getStartTime()))
                .filter(a -> appointmentTime.toLocalTime().isBefore(a.getEndTime()))
                .map(a -> a.getSlotDuration() != null && a.getSlotDuration() > 0 ? a.getSlotDuration() : 30)
                .findFirst()
                .orElse(30);
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

    public void markMessagesAsRead(UUID appointmentId, UUID receiverId) {
        List<ChatMessage> unreadMessages = chatMessageRepository.findByAppointmentIdOrderBySentAtAsc(appointmentId)
                .stream()
                .filter(m -> !m.isRead() && !m.getSenderId().equals(receiverId))
                .collect(Collectors.toList());

        if (!unreadMessages.isEmpty()) {
            unreadMessages.forEach(m -> m.setRead(true));
            chatMessageRepository.saveAll(unreadMessages);
        }
    }

    public List<UUID> getUnreadChatAppointmentsForUser(UUID userId) {
        List<Appointment> userAppointments = appointmentRepository.findByPatientIdOrDoctorId(userId, userId);
        return userAppointments.stream()
                .filter(a -> {
                    List<ChatMessage> messages = chatMessageRepository.findByAppointmentIdOrderBySentAtAsc(a.getId());
                    return messages.stream().anyMatch(m -> !m.isRead() && !m.getSenderId().equals(userId));
                })
                .map(Appointment::getId)
                .collect(Collectors.toList());
    }

    public ConsultationNote saveNote(UUID appointmentId, ConsultationNote note) {
        getAppointmentById(appointmentId);

        return consultationNoteRepository.findByAppointmentId(appointmentId)
                .map(existing -> {
                    existing.setChiefComplaint(note.getChiefComplaint());
                    existing.setClinicalNotes(note.getClinicalNotes());
                    existing.setDiagnosis(note.getDiagnosis());
                    existing.setDoctorId(note.getDoctorId());
                    existing.setPatientId(note.getPatientId());
                    return consultationNoteRepository.save(existing);
                })
                .orElseGet(() -> {
                    note.setAppointmentId(appointmentId);
                    return consultationNoteRepository.save(note);
                });
    }

    public ConsultationNote getNote(UUID appointmentId) {
        return consultationNoteRepository.findByAppointmentId(appointmentId)
                .orElse(null);
    }

    public List<ConsultationNote> getNotesByPatient(UUID patientId) {
        return consultationNoteRepository.findByPatientId(patientId);
    }

    public Prescription savePrescription(UUID appointmentId, Prescription prescription) {
        getAppointmentById(appointmentId);

        return prescriptionRepository.findByAppointmentId(appointmentId)
                .map(existing -> {
                    existing.setValidUntil(prescription.getValidUntil());
                    existing.setNotes(prescription.getNotes());
                    existing.setDoctorId(prescription.getDoctorId());
                    existing.setPatientId(prescription.getPatientId());

                    // Clear and update items
                    existing.getItems().clear();
                    if (prescription.getItems() != null) {
                        prescription.getItems().forEach(item -> {
                            item.setPrescription(existing);
                            existing.getItems().add(item);
                        });
                    }
                    return prescriptionRepository.save(existing);
                })
                .orElseGet(() -> {
                    prescription.setAppointmentId(appointmentId);
                    if (prescription.getItems() != null) {
                        prescription.getItems().forEach(item -> item.setPrescription(prescription));
                    }
                    return prescriptionRepository.save(prescription);
                });
    }

    public Prescription getPrescription(UUID appointmentId) {
        return prescriptionRepository.findByAppointmentId(appointmentId)
                .orElse(null);
    }

    public List<Prescription> getPrescriptionsByPatient(UUID patientId) {
        return prescriptionRepository.findByPatientId(patientId);
    }

    public Review saveReview(UUID appointmentId, Review review) {
        Appointment appointment = getAppointmentById(appointmentId);
        
        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new RuntimeException("Reviews can only be submitted for completed consultations.");
        }

        if (reviewRepository.findByAppointmentId(appointmentId).isPresent()) {
            throw new RuntimeException("A review already exists for this appointment.");
        }

        review.setAppointmentId(appointmentId);
        review.setPatientId(appointment.getPatientId());
        review.setDoctorId(appointment.getDoctorId());
        
        Review savedReview = reviewRepository.save(review);

        // Publish event for doctor-service to update doctor rating
        ReviewSubmittedEvent event = ReviewSubmittedEvent.builder()
                .appointmentId(appointmentId)
                .doctorId(appointment.getDoctorId())
                .rating(review.getRating())
                .build();
        kafkaTemplate.send("review-events", event);

        return savedReview;
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }
}
