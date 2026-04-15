package com.carelabs.notificationservice.service;

import com.carelabs.notificationservice.enums.NotificationEvent;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Builds visually appealing, professional HTML email bodies for each NotificationEvent.
 * All emails share the same brand header/footer; only the content card changes.
 */
@Service
public class EmailTemplateService {

    // ─── Brand colours ────────────────────────────────────────────────────────
    private static final String PRIMARY      = "#1A73E8";   // CareLabs blue
    private static final String PRIMARY_DARK = "#1557B0";
    private static final String SUCCESS      = "#34A853";
    private static final String DANGER       = "#EA4335";
    private static final String WARNING      = "#FBBC05";
    private static final String NEUTRAL      = "#5F6368";
    private static final String BG           = "#F8F9FA";
    private static final String CARD_BG      = "#FFFFFF";
    private static final String TEXT_DARK    = "#202124";
    private static final String TEXT_LIGHT   = "#5F6368";

    // ─── Public API ───────────────────────────────────────────────────────────

    public String buildSubject(NotificationEvent event) {
        return switch (event) {
            case APPOINTMENT_BOOKED    -> "✅ Appointment Request Received – CareLabs";
            case APPOINTMENT_ACCEPTED  -> "🎉 Your Appointment is Confirmed – CareLabs";
            case APPOINTMENT_REJECTED  -> "❌ Appointment Not Accepted – CareLabs";
            case APPOINTMENT_CANCELLED -> "⚠️ Appointment Cancelled – CareLabs";
            case APPOINTMENT_REMINDER  -> "⏰ Appointment Reminder – Starting in 2 Hours";
            case PAYMENT_SUCCESS       -> "💳 Payment Confirmed – CareLabs";
            case PAYMENT_FAILED        -> "🚨 Payment Failed – CareLabs";
            case REFUND_REQUESTED      -> "🔄 Refund Request Received – CareLabs";
            case REFUND_PROCESSED      -> "💰 Refund Processed – CareLabs";
            case PRESCRIPTION_ISSUED   -> "💊 New Prescription Issued – CareLabs";
            case DOC_APPROVED          -> "✅ Doctor Account Approved – CareLabs";
            case DOC_REJECTED          -> "❌ Doctor Verification Rejected – CareLabs";
            case PAYOUT_PROCESSED      -> "💵 Payout Processed – CareLabs";
            case ANNOUNCEMENT          -> "📢 Platform Announcement – CareLabs";
        };
    }

    /**
     * Entry point. Returns a complete HTML email string.
     */
    public String buildHtml(NotificationEvent event, Map<String, String> data) {
        String contentCard = switch (event) {
            case APPOINTMENT_BOOKED    -> buildAppointmentBooked(data);
            case APPOINTMENT_ACCEPTED  -> buildAppointmentAccepted(data);
            case APPOINTMENT_REJECTED  -> buildAppointmentRejected(data);
            case APPOINTMENT_CANCELLED -> buildAppointmentCancelled(data);
            case APPOINTMENT_REMINDER  -> buildAppointmentReminder(data);
            case PAYMENT_SUCCESS       -> buildPaymentSuccess(data);
            case PAYMENT_FAILED        -> buildPaymentFailed(data);
            case REFUND_REQUESTED      -> buildRefundRequested(data);
            case REFUND_PROCESSED      -> buildRefundProcessed(data);
            case PRESCRIPTION_ISSUED   -> buildPrescriptionIssued(data);
            case DOC_APPROVED          -> buildDocApproved(data);
            case DOC_REJECTED          -> buildDocRejected(data);
            case PAYOUT_PROCESSED      -> buildPayoutProcessed(data);
            case ANNOUNCEMENT          -> buildAnnouncement(data);
        };
        return wrapInShell(contentCard);
    }

    // ─── Brand shell (header + footer) ───────────────────────────────────────

    private String wrapInShell(String contentCard) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
              <title>CareLabs Notification</title>
            </head>
            <body style="margin:0;padding:0;background-color:%s;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:%s;">
                <tr><td align="center" style="padding:32px 16px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;">

                    <!-- HEADER -->
                    <tr>
                      <td style="background:linear-gradient(135deg,%s 0%%,%s 100%%);
                                 border-radius:12px 12px 0 0;padding:28px 36px;text-align:center;">
                        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;
                                   letter-spacing:-0.5px;">
                          🏥 CareLabs
                        </h1>
                        <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">
                          Smart Healthcare · Appointment & Telemedicine Platform
                        </p>
                      </td>
                    </tr>

                    <!-- CONTENT CARD -->
                    <tr>
                      <td style="background:%s;padding:0;">
                        %s
                      </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                      <td style="background:%s;border-radius:0 0 12px 12px;
                                 padding:20px 36px;text-align:center;
                                 border-top:1px solid #E8EAED;">
                        <p style="margin:0 0 8px;color:%s;font-size:12px;">
                          This email was sent by the <strong>CareLabs Platform</strong>.
                          Please do not reply directly to this email.
                        </p>
                        <p style="margin:0;color:%s;font-size:11px;">
                          © 2025 CareLabs · SLIIT SE Year 3 Distributed Systems Project
                        </p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(BG, BG, PRIMARY, PRIMARY_DARK, CARD_BG, contentCard, CARD_BG, TEXT_LIGHT, TEXT_LIGHT);
    }

    // ─── Shared helpers ───────────────────────────────────────────────────────

    /** Coloured badge pill */
    private String badge(String text, String colour) {
        return """
            <span style="display:inline-block;background:%s;color:#fff;
                         font-size:11px;font-weight:600;padding:3px 10px;
                         border-radius:20px;letter-spacing:0.3px;">%s</span>
            """.formatted(colour, text);
    }

    /** Section heading inside the card */
    private String sectionHeading(String icon, String title, String accentColour) {
        return """
            <tr>
              <td style="padding:28px 36px 0;">
                <div style="display:inline-flex;align-items:center;gap:10px;">
                  <span style="font-size:28px;">%s</span>
                  <h2 style="margin:0;font-size:20px;font-weight:700;color:%s;">%s</h2>
                </div>
              </td>
            </tr>
            """.formatted(icon, accentColour, title);
    }

    /** Info row inside a detail table */
    private String infoRow(String label, String value) {
        return """
            <tr>
              <td style="padding:8px 0;color:%s;font-size:13px;font-weight:600;
                         white-space:nowrap;width:160px;">%s</td>
              <td style="padding:8px 0;color:%s;font-size:14px;">%s</td>
            </tr>
            """.formatted(TEXT_LIGHT, label, TEXT_DARK, value);
    }

    /** A highlighted info block (e.g. appointment time callout) */
    private String calloutBox(String text, String bgColour, String borderColour) {
        return """
            <div style="background:%s;border-left:4px solid %s;border-radius:6px;
                        padding:14px 18px;margin:18px 0;color:%s;font-size:14px;
                        line-height:1.6;">%s</div>
            """.formatted(bgColour, borderColour, TEXT_DARK, text);
    }

    /** CTA Button */
    private String button(String text, String href, String colour) {
        return """
            <a href="%s" style="display:inline-block;background:%s;color:#ffffff;
               font-size:14px;font-weight:600;text-decoration:none;
               padding:12px 28px;border-radius:8px;margin-top:6px;">%s</a>
            """.formatted(href, colour, text);
    }

    private String get(Map<String, String> data, String key) {
        return data.getOrDefault(key, "N/A");
    }

    // ─── Individual email content cards ───────────────────────────────────────

    /**
     * APPOINTMENT_BOOKED → sent to DOCTOR
     * extraData keys: patientName, appointmentTime, appointmentType, reason, appointmentId
     */
    private String buildAppointmentBooked(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;">
                <p style="margin:0;color:%s;font-size:15px;line-height:1.7;">
                  You have a <strong>new appointment request</strong> from a patient.
                  Please review and respond at your earliest convenience.
                </p>
              </td></tr>
              <tr><td style="padding:20px 36px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="background:%s;border:1px solid #E8EAED;border-radius:8px;padding:16px 20px;">
                  %s
                  %s
                  %s
                  %s
                </table>
              </td></tr>
              <tr><td style="padding:0 36px;">
                %s
              </td></tr>
              <tr><td style="padding:20px 36px 32px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading("📅", "New Appointment Request", PRIMARY),
                TEXT_DARK,
                BG,
                infoRow("Patient", get(data, "patientName")),
                infoRow("Date & Time", get(data, "appointmentTime")),
                infoRow("Type", get(data, "appointmentType")),
                infoRow("Reason", get(data, "reason")),
                calloutBox("⏳ Please log in to CareLabs and <strong>accept or reject</strong> this request.",
                        "#EBF3FB", PRIMARY),
                button("Open CareLabs Dashboard", "http://localhost:3000/dashboard", PRIMARY)
        );
    }

    /**
     * APPOINTMENT_ACCEPTED → sent to PATIENT
     * extraData keys: doctorName, doctorSpecialty, appointmentTime, appointmentType, meetingLink
     */
    private String buildAppointmentAccepted(Map<String, String> data) {
        String meetingSection = "TELEMEDICINE".equalsIgnoreCase(get(data, "appointmentType"))
                ? calloutBox("🎥 <strong>Video Consultation Link:</strong><br/>" +
                        "<a href=\"" + get(data, "meetingLink") + "\" style=\"color:" + PRIMARY + ";\">"
                        + get(data, "meetingLink") + "</a>", "#EBF3FB", SUCCESS)
                : calloutBox("🏥 This is an <strong>in-clinic</strong> appointment. Please arrive 10 minutes early.",
                        "#E6F4EA", SUCCESS);

        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;">
                <p style="margin:0;color:%s;font-size:15px;line-height:1.7;">
                  Great news! Your doctor has <strong style="color:%s;">confirmed</strong> your appointment.
                  Your health is in good hands. 💚
                </p>
              </td></tr>
              <tr><td style="padding:20px 36px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="background:%s;border:1px solid #E8EAED;border-radius:8px;padding:16px 20px;">
                  %s
                  %s
                  %s
                </table>
              </td></tr>
              <tr><td style="padding:0 36px 32px;">%s</td></tr>
            </table>
            """.formatted(
                sectionHeading("🎉", "Appointment Confirmed!", SUCCESS),
                TEXT_DARK, SUCCESS, BG,
                infoRow("Doctor", get(data, "doctorName") + " · " + get(data, "doctorSpecialty")),
                infoRow("Date & Time", get(data, "appointmentTime")),
                infoRow("Type", get(data, "appointmentType")),
                meetingSection
        );
    }

    /**
     * APPOINTMENT_REJECTED → sent to PATIENT
     * extraData keys: doctorName, appointmentTime, rejectionReason
     */
    private String buildAppointmentRejected(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;">
                <p style="margin:0;color:%s;font-size:15px;line-height:1.7;">
                  We regret to inform you that your appointment request could not be accepted at this time.
                  You can book with another available doctor through the platform.
                </p>
              </td></tr>
              <tr><td style="padding:20px 36px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="background:#FEF7F7;border:1px solid #FCCDD1;border-radius:8px;padding:16px 20px;">
                  %s
                  %s
                  %s
                </table>
              </td></tr>
              <tr><td style="padding:0 36px;">
                %s
              </td></tr>
              <tr><td style="padding:20px 36px 32px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading("❌", "Appointment Not Accepted", DANGER),
                TEXT_DARK,
                infoRow("Doctor", get(data, "doctorName")),
                infoRow("Requested Time", get(data, "appointmentTime")),
                infoRow("Reason", get(data, "rejectionReason")),
                calloutBox("We apologise for the inconvenience. Please browse other available doctors and try booking again.",
                        "#FEF7F7", DANGER),
                button("Find Another Doctor", "http://localhost:3000/doctors", PRIMARY)
        );
    }

    /**
     * APPOINTMENT_CANCELLED → sent to DOCTOR
     * extraData keys: patientName, appointmentTime, cancelReason
     */
    private String buildAppointmentCancelled(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;">
                <p style="margin:0;color:%s;font-size:15px;line-height:1.7;">
                  A patient has cancelled their upcoming appointment with you.
                  Your schedule has been updated accordingly.
                </p>
              </td></tr>
              <tr><td style="padding:20px 36px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="background:#FFFBF0;border:1px solid #FCE8B3;border-radius:8px;padding:16px 20px;">
                  %s
                  %s
                  %s
                </table>
              </td></tr>
              <tr><td style="padding:0 36px 32px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading("⚠️", "Appointment Cancelled", WARNING),
                TEXT_DARK,
                infoRow("Patient", get(data, "patientName")),
                infoRow("Was Scheduled For", get(data, "appointmentTime")),
                infoRow("Cancellation Reason", get(data, "cancelReason")),
                calloutBox("This time slot is now free. Your availability has been updated in the system.",
                        "#FFFBF0", WARNING)
        );
    }

    /**
     * APPOINTMENT_REMINDER → sent to BOTH patient and doctor
     * extraData keys: recipientName, otherPartyName, otherPartyRole, appointmentTime,
     *                 appointmentType, meetingLink (optional)
     */
    private String buildAppointmentReminder(Map<String, String> data) {
        boolean isTelemedicine = "TELEMEDICINE".equalsIgnoreCase(get(data, "appointmentType"));
        String locationSection = isTelemedicine
                ? calloutBox("🎥 <strong>Join via Video:</strong> <a href=\"" + get(data, "meetingLink")
                        + "\" style=\"color:" + PRIMARY + ";\">" + get(data, "meetingLink") + "</a>",
                        "#EBF3FB", PRIMARY)
                : calloutBox("🏥 <strong>In-Clinic Visit</strong> — please arrive 10 minutes before your scheduled time.",
                        "#E6F4EA", SUCCESS);

        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;text-align:center;">
                <div style="background:%s;border-radius:12px;padding:20px;display:inline-block;
                            border:2px dashed %s;margin-bottom:8px;">
                  <p style="margin:0;font-size:36px;font-weight:800;color:%s;">2 Hours</p>
                  <p style="margin:4px 0 0;font-size:13px;color:%s;">Until your appointment</p>
                </div>
              </td></tr>
              <tr><td style="padding:16px 36px 0;">
                <p style="margin:0;color:%s;font-size:15px;line-height:1.7;">
                  Hi <strong>%s</strong>, this is your reminder that your appointment
                  with <strong>%s</strong> is coming up shortly.
                </p>
              </td></tr>
              <tr><td style="padding:20px 36px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="background:%s;border:1px solid #E8EAED;border-radius:8px;padding:16px 20px;">
                  %s
                  %s
                  %s
                </table>
              </td></tr>
              <tr><td style="padding:0 36px 32px;">%s</td></tr>
            </table>
            """.formatted(
                sectionHeading("⏰", "Appointment Reminder", PRIMARY),
                "#EBF3FB", PRIMARY, PRIMARY, TEXT_LIGHT,
                TEXT_DARK,
                get(data, "recipientName"),
                get(data, "otherPartyName"),
                BG,
                infoRow(get(data, "otherPartyRole"), get(data, "otherPartyName")),
                infoRow("Scheduled Time", get(data, "appointmentTime")),
                infoRow("Type", get(data, "appointmentType")),
                locationSection
        );
    }

    /**
     * PAYMENT_SUCCESS → sent to PATIENT and DOCTOR
     * extraData keys: recipientName, appointmentTime, doctorName, amount, currency,
     *                 transactionId, paymentMethod, appointmentType
     */
    private String buildPaymentSuccess(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;text-align:center;">
                <div style="width:64px;height:64px;background:#E6F4EA;border-radius:50%%;
                            margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
                  <span style="font-size:36px;">✅</span>
                </div>
                <p style="margin:0;font-size:24px;font-weight:700;color:%s;">
                  %s %s
                </p>
                <p style="margin:4px 0 0;color:%s;font-size:13px;">Payment Received</p>
              </td></tr>
              <tr><td style="padding:20px 36px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="background:%s;border:1px solid #E8EAED;border-radius:8px;padding:16px 20px;">
                  %s
                  %s
                  %s
                  %s
                  %s
                </table>
              </td></tr>
              <tr><td style="padding:0 36px 32px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading("💳", "Payment Successful – Appointment Confirmed", SUCCESS),
                SUCCESS, get(data, "currency"), get(data, "amount"), TEXT_LIGHT,
                BG,
                infoRow("Transaction ID", get(data, "transactionId")),
                infoRow("Payment Method", get(data, "paymentMethod")),
                infoRow("Doctor", get(data, "doctorName")),
                infoRow("Appointment", get(data, "appointmentTime")),
                infoRow("Type", get(data, "appointmentType")),
                calloutBox("🎉 Your appointment is now <strong>fully confirmed</strong>. "
                        + "You will receive a reminder 2 hours before the session.", "#E6F4EA", SUCCESS)
        );
    }

    /**
     * PAYMENT_FAILED → sent to PATIENT
     * extraData keys: patientName, appointmentTime, amount, currency, failureReason
     */
    private String buildPaymentFailed(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;">
                <p style="margin:0;color:%s;font-size:15px;line-height:1.7;">
                  Hi <strong>%s</strong>, unfortunately your payment of
                  <strong>%s %s</strong> for your appointment on <strong>%s</strong>
                  could not be processed.
                </p>
              </td></tr>
              <tr><td style="padding:12px 36px;">
                %s
              </td></tr>
              <tr><td style="padding:0 36px 32px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading("🚨", "Payment Failed", DANGER),
                TEXT_DARK,
                get(data, "patientName"),
                get(data, "currency"), get(data, "amount"),
                get(data, "appointmentTime"),
                calloutBox("<strong>Reason:</strong> " + get(data, "failureReason")
                        + "<br/><br/>Please check your payment details and try again. "
                        + "Your appointment slot has been held temporarily.", "#FEF7F7", DANGER),
                button("Retry Payment", "http://localhost:3000/payments", DANGER)
        );
    }

    /**
     * REFUND_REQUESTED → sent to ADMIN
     * extraData keys: patientName, patientEmail, appointmentTime, amount, currency, refundReason
     */
    private String buildRefundRequested(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;">
                <p style="margin:0;color:%s;font-size:15px;line-height:1.7;">
                  A patient has submitted a refund request that requires your review.
                  Please process this at your earliest convenience.
                </p>
              </td></tr>
              <tr><td style="padding:20px 36px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="background:#FFFBF0;border:1px solid #FCE8B3;border-radius:8px;padding:16px 20px;">
                  %s
                  %s
                  %s
                  %s
                  %s
                </table>
              </td></tr>
              <tr><td style="padding:0 36px 32px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading("🔄", "Refund Request – Admin Action Required", WARNING),
                TEXT_DARK,
                infoRow("Patient Name", get(data, "patientName")),
                infoRow("Patient Email", get(data, "patientEmail")),
                infoRow("Appointment Date", get(data, "appointmentTime")),
                infoRow("Refund Amount", get(data, "currency") + " " + get(data, "amount")),
                infoRow("Reason", get(data, "refundReason")),
                button("Review in Admin Panel", "http://localhost:3000/admin/refunds", WARNING)
        );
    }

    /**
     * REFUND_PROCESSED → sent to PATIENT
     * extraData keys: patientName, amount, currency, appointmentTime, transactionId
     */
    private String buildRefundProcessed(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;text-align:center;">
                <p style="margin:0;font-size:28px;font-weight:800;color:%s;">
                  %s %s Refunded
                </p>
                <p style="margin:6px 0 0;color:%s;font-size:13px;">
                  The amount will appear in your account within 3–5 business days.
                </p>
              </td></tr>
              <tr><td style="padding:20px 36px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="background:%s;border:1px solid #E8EAED;border-radius:8px;padding:16px 20px;">
                  %s
                  %s
                  %s
                </table>
              </td></tr>
              <tr><td style="padding:0 36px 32px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading("💰", "Your Refund Has Been Processed", SUCCESS),
                SUCCESS, get(data, "currency"), get(data, "amount"), TEXT_LIGHT,
                BG,
                infoRow("Patient", get(data, "patientName")),
                infoRow("Appointment Date", get(data, "appointmentTime")),
                infoRow("Reference ID", get(data, "transactionId")),
                calloutBox("✅ Your refund has been approved and processed. "
                        + "We appreciate your patience and hope to serve you again soon.", "#E6F4EA", SUCCESS)
        );
    }

    /**
     * PRESCRIPTION_ISSUED → sent to PATIENT
     * extraData keys: patientName, doctorName, doctorSpecialty, appointmentTime, prescriptionDetails
     */
    private String buildPrescriptionIssued(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;">
                <p style="margin:0;color:%s;font-size:15px;line-height:1.7;">
                  Hi <strong>%s</strong>, your doctor has issued a new digital prescription
                  following your consultation. Please review it in your CareLabs patient portal.
                </p>
              </td></tr>
              <tr><td style="padding:20px 36px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="background:%s;border:1px solid #E8EAED;border-radius:8px;padding:16px 20px;">
                  %s
                  %s
                  %s
                </table>
              </td></tr>
              <tr><td style="padding:0 36px;">
                %s
              </td></tr>
              <tr><td style="padding:16px 36px 32px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading("💊", "New Prescription Available", PRIMARY),
                TEXT_DARK, get(data, "patientName"),
                BG,
                infoRow("Prescribed By", get(data, "doctorName") + " · " + get(data, "doctorSpecialty")),
                infoRow("Consultation Date", get(data, "appointmentTime")),
                infoRow("Notes", get(data, "prescriptionDetails")),
                calloutBox("⚠️ <strong>Important:</strong> Follow your doctor's instructions carefully. "
                        + "Purchase medications only from licensed pharmacies.", "#FFFBF0", WARNING),
                button("View Prescription", "http://localhost:3000/prescriptions", PRIMARY)
        );
    }

    /**
     * DOC_APPROVED → sent to DOCTOR
     * extraData keys: doctorName
     */
    private String buildDocApproved(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:20px 36px 0;text-align:center;">
                <p style="margin:0;font-size:18px;color:%s;line-height:1.7;">
                  Congratulations, <strong>%s</strong>!<br/>
                  Your doctor registration has been <strong style="color:%s;">verified and approved</strong>
                  by our admin team. You can now start accepting patient appointments.
                </p>
              </td></tr>
              <tr><td style="padding:20px 36px;">
                %s
              </td></tr>
              <tr><td style="padding:0 36px 32px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading("✅", "Doctor Account Approved", SUCCESS),
                TEXT_DARK, get(data, "doctorName"), SUCCESS,
                calloutBox("🏥 Your profile is now publicly visible to patients. "
                        + "Set your availability schedule and consultation fee to start receiving bookings.", "#E6F4EA", SUCCESS),
                button("Set My Availability", "http://localhost:3000/doctor/dashboard", SUCCESS)
        );
    }

    /**
     * DOC_REJECTED → sent to DOCTOR
     * extraData keys: doctorName, rejectionReason
     */
    private String buildDocRejected(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;">
                <p style="margin:0;color:%s;font-size:15px;line-height:1.7;">
                  Hi <strong>%s</strong>, after reviewing your submitted documents,
                  our admin team was unable to verify your registration at this time.
                </p>
              </td></tr>
              <tr><td style="padding:12px 36px;">
                %s
              </td></tr>
              <tr><td style="padding:0 36px 32px;">
                <p style="margin:0 0 12px;color:%s;font-size:13px;line-height:1.6;">
                  Please re-upload your documentation ensuring all information is clearly visible and correct.
                  If you believe this is an error, please contact our support team.
                </p>
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading("❌", "Doctor Verification Rejected", DANGER),
                TEXT_DARK, get(data, "doctorName"),
                calloutBox("<strong>Rejection Reason:</strong> " + get(data, "rejectionReason"), "#FEF7F7", DANGER),
                TEXT_LIGHT,
                button("Resubmit Documents", "http://localhost:3000/doctor/profile", PRIMARY)
        );
    }

    /**
     * PAYOUT_PROCESSED → sent to DOCTOR
     * extraData keys: doctorName, amount, currency, bankName, accountNumber
     */
    private String buildPayoutProcessed(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;text-align:center;">
                <p style="margin:0;font-size:28px;font-weight:800;color:%s;">
                  %s %s
                </p>
                <p style="margin:6px 0 0;color:%s;font-size:13px;">Has been transferred to your bank account</p>
              </td></tr>
              <tr><td style="padding:20px 36px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="background:%s;border:1px solid #E8EAED;border-radius:8px;padding:16px 20px;">
                  %s
                  %s
                  %s
                </table>
              </td></tr>
              <tr><td style="padding:0 36px 32px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading("💵", "Payout Processed Successfully", SUCCESS),
                SUCCESS, get(data, "currency"), get(data, "amount"), TEXT_LIGHT,
                BG,
                infoRow("Doctor", get(data, "doctorName")),
                infoRow("Bank", get(data, "bankName")),
                infoRow("Account", "****" + get(data, "accountNumber").replaceAll(".*(.{4})$", "$1")),
                calloutBox("✅ Your earnings have been transferred. "
                        + "Please allow 1–2 business days for the funds to appear in your account.", "#E6F4EA", SUCCESS)
        );
    }

    /**
     * ANNOUNCEMENT → sent to broad role (ALL, DOCTOR, PATIENT)
     * extraData keys: title, message
     */
    private String buildAnnouncement(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;">
                <p style="margin:0;color:%s;font-size:15px;line-height:1.7;">
                   %s
                </p>
              </td></tr>
              <tr><td style="padding:32px 36px 32px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading("📢", get(data, "title"), PRIMARY),
                TEXT_DARK,
                get(data, "message"),
                button("Visit Dashboard", "http://localhost:3000/dashboard", PRIMARY)
        );
    }
}