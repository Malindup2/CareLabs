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
    private static final String PRIMARY_DARK = "#0D47A1";
    private static final String SUCCESS      = "#1E8E3E";
    private static final String DANGER       = "#D93025";
    private static final String WARNING      = "#F9AB00";
    private static final String NEUTRAL      = "#5F6368";
    private static final String BG           = "#F9FAFB";
    private static final String CARD_BG      = "#FFFFFF";
    private static final String TEXT_DARK    = "#202124";
    private static final String TEXT_LIGHT   = "#5F6368";

    // ─── Public API ───────────────────────────────────────────────────────────

    public String buildSubject(NotificationEvent event) {
        return switch (event) {
            case APPOINTMENT_BOOKED    -> "Appointment Request Received - CareLabs";
            case APPOINTMENT_ACCEPTED  -> "Appointment Successfully Confirmed - CareLabs";
            case APPOINTMENT_REJECTED  -> "Appointment Request Update - CareLabs";
            case APPOINTMENT_CANCELLED -> "Appointment Cancellation Notice - CareLabs";
            case APPOINTMENT_REMINDER  -> "Scheduled Appointment Reminder - CareLabs";
            case PAYMENT_SUCCESS       -> "Payment Transaction Confirmed - CareLabs";
            case PAYMENT_FAILED        -> "Payment Transaction Failed - Action Required";
            case REFUND_REQUESTED      -> "Refund Request Received - CareLabs";
            case REFUND_PROCESSED      -> "Refund Processed Successfully - CareLabs";
            case PRESCRIPTION_ISSUED   -> "New Digital Prescription Issued - CareLabs";
            case DOC_APPROVED          -> "Professional Account Verification Successful - CareLabs";
            case DOC_REJECTED          -> "Account Verification Update - CareLabs";
            case PAYOUT_PROCESSED      -> "Merchant Payout Processed - CareLabs";
            case ANNOUNCEMENT          -> "Platform Announcement - CareLabs";
        };
    }

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
            <body style="margin:0;padding:0;background-color:%s;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:%s;">
                <tr><td align="center" style="padding:48px 16px;">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;">

                    <!-- HEADER -->
                    <tr>
                      <td style="background:%s;
                                 border-radius:12px 12px 0 0;padding:36px;text-align:left;
                                 border-bottom:3px solid %s;">
                        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600;
                                   text-transform:uppercase;letter-spacing:1px;font-family:inherit;">
                          CareLabs
                        </h1>
                        <p style="margin:4px 0 0;color:rgba(255,255,255,0.9);font-size:12px;font-weight:500;">
                          PROFESSIONAL HEALTHCARE NETWORK
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
                                 padding:24px 36px;text-align:left;
                                 border-top:1px solid #EEEEEE;">
                        <p style="margin:0 0 8px;color:%s;font-size:12px;line-height:1.5;">
                          <strong>Confidentiality Notice:</strong> This message contains information prepared for the recipient. 
                          If you are not the intended recipient, please notify the sender immediately.
                        </p>
                        <p style="margin:12px 0 0;color:%s;font-size:11px;">
                          © 2025 CareLabs Platform · Sri Lanka
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

    private String sectionHeading(String ignore, String title, String accentColour) {
        return """
            <tr>
              <td style="padding:36px 36px 12px;">
                <h2 style="margin:0;font-size:18px;font-weight:600;color:%s;
                           text-transform:uppercase;letter-spacing:0.5px;
                           border-left:4px solid %s;padding-left:16px;">
                  %s
                </h2>
              </td>
            </tr>
            """.formatted(accentColour, accentColour, title);
    }

    private String infoRow(String label, String value) {
        return """
            <tr>
              <td style="padding:12px 0;color:%s;font-size:12px;font-weight:600;
                         text-transform:uppercase;width:140px;letter-spacing:0.3px;">%s</td>
              <td style="padding:12px 0;color:%s;font-size:14px;font-weight:500;">%s</td>
            </tr>
            """.formatted(TEXT_LIGHT, label, TEXT_DARK, value);
    }

    private String calloutBox(String text, String bgColour, String borderColour) {
        return """
            <div style="background:%s;border-left:4px solid %s;border-radius:4px;
                        padding:20px;margin:24px 0;color:%s;font-size:14px;
                        line-height:1.6;border:1px solid #EEEEEE;border-left-width:4px;">%s</div>
            """.formatted(bgColour, borderColour, TEXT_DARK, text);
    }

    private String button(String text, String href, String colour) {
        return """
            <a href="%s" style="display:inline-block;background:%s;color:#ffffff;
               font-size:13px;font-weight:600;text-decoration:none;text-transform:uppercase;
               padding:16px 36px;border-radius:4px;margin-top:12px;letter-spacing:0.5px;">%s</a>
            """.formatted(href, colour, text);
    }

    private String get(Map<String, String> data, String key) {
        return data.getOrDefault(key, "N/A");
    }

    // ─── Individual email content cards ───────────────────────────────────────

    /**
     * APPOINTMENT_BOOKED → sent to DOCTOR
     */
    private String buildAppointmentBooked(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;">
                <p style="margin:0;color:%s;font-size:14px;line-height:1.7;">
                  A new appointment request has been submitted for your review. 
                  Please evaluate the patient's case details below and provide your response through the provider portal.
                </p>
              </td></tr>
              <tr><td style="padding:24px 36px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="background:%s;border:1px solid #EEEEEE;border-radius:4px;padding:24px;">
                  %s
                  %s
                  %s
                  %s
                </table>
              </td></tr>
              <tr><td style="padding:0 36px;">
                %s
              </td></tr>
              <tr><td style="padding:24px 36px 48px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading(null, "New Appointment Request", PRIMARY),
                TEXT_DARK,
                BG,
                infoRow("Patient Name", get(data, "patientName")),
                infoRow("Scheduled Time", get(data, "appointmentTime")),
                infoRow("Consultation Type", get(data, "appointmentType")),
                infoRow("Clinical Reason", get(data, "reason")),
                calloutBox("Action Required: Please authenticate into the CareLabs Dashboard to accept or decline this request.",
                        "#F4F8FE", PRIMARY),
                button("Access Provider Portal", "http://localhost:3000/dashboard", PRIMARY)
        );
    }

    /**
     * APPOINTMENT_ACCEPTED → sent to PATIENT
     */
    private String buildAppointmentAccepted(Map<String, String> data) {
        String meetingSection = "TELEMEDICINE".equalsIgnoreCase(get(data, "appointmentType"))
                ? calloutBox("<strong>Telemedicine Link:</strong><br/>" +
                        "<a href=\"" + get(data, "meetingLink") + "\" style=\"color:" + PRIMARY + ";\">"
                        + get(data, "meetingLink") + "</a>", "#F1F9F4", SUCCESS)
                : calloutBox("<strong>Note:</strong> This is an in-clinic consultation. Please arrive at the facility 10 minutes prior to your scheduled time.",
                        "#F1F9F4", SUCCESS);

        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;">
                <p style="margin:0;color:%s;font-size:14px;line-height:1.7;">
                  Your appointment request has been formally <strong>confirmed</strong> by the healthcare provider. 
                  Please find the final coordination details below.
                </p>
              </td></tr>
              <tr><td style="padding:24px 36px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="background:%s;border:1px solid #EEEEEE;border-radius:4px;padding:24px;">
                  %s
                  %s
                  %s
                </table>
              </td></tr>
              <tr><td style="padding:0 36px 48px;">%s</td></tr>
            </table>
            """.formatted(
                sectionHeading(null, "Appointment Confirmation", SUCCESS),
                TEXT_DARK, BG,
                infoRow("Healthcare Provider", get(data, "doctorName") + " (" + get(data, "doctorSpecialty") + ")"),
                infoRow("Scheduled Time", get(data, "appointmentTime")),
                infoRow("Consultation Type", get(data, "appointmentType")),
                meetingSection
        );
    }

    /**
     * APPOINTMENT_REJECTED → sent to PATIENT
     */
    private String buildAppointmentRejected(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;">
                <p style="margin:0;color:%s;font-size:14px;line-height:1.7;">
                  We wish to inform you that your appointment request could not be accommodated at this time. 
                  You may re-apply for a different time slot or browse other available providers.
                </p>
              </td></tr>
              <tr><td style="padding:24px 36px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="background:#FEF7F7;border:1px solid #FCCDD1;border-radius:4px;padding:24px;">
                  %s
                  %s
                  %s
                </table>
              </td></tr>
              <tr><td style="padding:0 36px;">
                %s
              </td></tr>
              <tr><td style="padding:24px 36px 48px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading(null, "Appointment Update", DANGER),
                TEXT_DARK,
                infoRow("Healthcare Provider", get(data, "doctorName")),
                infoRow("Requested Time", get(data, "appointmentTime")),
                infoRow("Status Detail", get(data, "rejectionReason")),
                calloutBox("We apologize for the inconvenience. Please utilize the platform to select an alternative provider.",
                        "#FEF7F7", DANGER),
                button("Browse Available Providers", "http://localhost:3000/doctors", PRIMARY)
        );
    }

    /**
     * APPOINTMENT_CANCELLED → sent to DOCTOR
     */
    private String buildAppointmentCancelled(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;">
                <p style="margin:0;color:%s;font-size:14px;line-height:1.7;">
                  Please be advised that the following appointment has been <strong>cancelled</strong>. 
                  Your professional schedule has been adjusted to reflect this change.
                </p>
              </td></tr>
              <tr><td style="padding:24px 36px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="background:#FFFBF0;border:1px solid #FCE8B3;border-radius:4px;padding:24px;">
                  %s
                  %s
                  %s
                </table>
              </td></tr>
              <tr><td style="padding:0 36px 48px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading(null, "Appointment Cancellation Notice", WARNING),
                TEXT_DARK,
                infoRow("Patient Name", get(data, "patientName")),
                infoRow("Original Schedule", get(data, "appointmentTime")),
                infoRow("Cancellation Reason", get(data, "cancelReason")),
                calloutBox("System Notice: This time slot is now available for new bookings. Your availability has been updated.",
                        "#FFFBF0", WARNING)
        );
    }

    /**
     * APPOINTMENT_REMINDER → sent to BOTH patient and doctor
     */
    private String buildAppointmentReminder(Map<String, String> data) {
        boolean isTelemedicine = "TELEMEDICINE".equalsIgnoreCase(get(data, "appointmentType"));
        String locationSection = isTelemedicine
                ? calloutBox("<strong>Telemedicine Access Link:</strong> <a href=\"" + get(data, "meetingLink")
                        + "\" style=\"color:" + PRIMARY + ";\">" + get(data, "meetingLink") + "</a>",
                        "#F4F8FE", PRIMARY)
                : calloutBox("<strong>Note:</strong> This is a scheduled in-clinic consultation. Please ensure you arrive 10 minutes prior to the time below.",
                        "#F1F9F4", SUCCESS);

        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:32px 36px 8px;text-align:center;">
                <div style="background:#F4F8FE;border-radius:4px;padding:32px;display:inline-block;
                            border:1px solid #D1E3F8;margin-bottom:8px;">
                  <p style="margin:0;font-size:32px;font-weight:600;color:%s;letter-spacing:1px;">T-MINUS 2 HOURS</p>
                  <p style="margin:8px 0 0;font-size:12px;color:%s;text-transform:uppercase;font-weight:600;">Scheduled Consultation</p>
                </div>
              </td></tr>
              <tr><td style="padding:16px 36px 0;">
                <p style="margin:0;color:%s;font-size:14px;line-height:1.7;">
                  Esteemed <strong>%s</strong>, this is a formal reminder for your upcoming consultation
                  with <strong>%s</strong> scheduled for today.
                </p>
              </td></tr>
              <tr><td style="padding:24px 36px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="background:%s;border:1px solid #EEEEEE;border-radius:4px;padding:24px;">
                  %s
                  %s
                  %s
                </table>
              </td></tr>
              <tr><td style="padding:0 36px 48px;">%s</td></tr>
            </table>
            """.formatted(
                sectionHeading(null, "Consultation Reminder", PRIMARY),
                PRIMARY, TEXT_LIGHT,
                TEXT_DARK,
                get(data, "recipientName"),
                get(data, "otherPartyName"),
                BG,
                infoRow(get(data, "otherPartyRole"), get(data, "otherPartyName")),
                infoRow("Scheduled Time", get(data, "appointmentTime")),
                infoRow("Consultation Type", get(data, "appointmentType")),
                locationSection
        );
    }

    /**
     * PAYMENT_SUCCESS → sent to PATIENT and DOCTOR
     */
    private String buildPaymentSuccess(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:32px 36px 0;text-align:center;">
                <p style="margin:0;font-size:28px;font-weight:600;color:%s;letter-spacing:-0.5px;">
                  %s %s
                </p>
                <p style="margin:8px 0 0;color:%s;font-size:12px;text-transform:uppercase;font-weight:600;letter-spacing:1px;">Transaction Confirmed</p>
              </td></tr>
              <tr><td style="padding:24px 36px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="background:%s;border:1px solid #EEEEEE;border-radius:4px;padding:24px;">
                  %s
                  %s
                  %s
                  %s
                  %s
                </table>
              </td></tr>
              <tr><td style="padding:0 36px 48px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading(null, "Payment Receipt & Confirmation", SUCCESS),
                SUCCESS, get(data, "currency"), get(data, "amount"), TEXT_LIGHT,
                BG,
                infoRow("Transaction Ref", get(data, "transactionId")),
                infoRow("Payment Method", get(data, "paymentMethod")),
                infoRow("Healthcare Provider", get(data, "doctorName")),
                infoRow("Scheduled Time", get(data, "appointmentTime")),
                infoRow("Consultation Type", get(data, "appointmentType")),
                calloutBox("This receipt confirms that your appointment is now formally scheduled. You will receive a final reminder prior to the consultation session.", 
                        "#F1F9F4", SUCCESS)
        );
    }

    /**
     * PAYMENT_FAILED → sent to PATIENT
     */
    private String buildPaymentFailed(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;">
                <p style="margin:0;color:%s;font-size:14px;line-height:1.7;">
                  Please be informed that your payment of <strong>%s %s</strong> for the appointment 
                  scheduled on <strong>%s</strong> could not be processed.
                </p>
              </td></tr>
              <tr><td style="padding:12px 36px;">
                %s
              </td></tr>
              <tr><td style="padding:0 36px 48px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading(null, "Payment Transaction Failure", DANGER),
                TEXT_DARK,
                get(data, "currency"), get(data, "amount"),
                get(data, "appointmentTime"),
                calloutBox("<strong>Error Detail:</strong> " + get(data, "failureReason")
                        + "<br/><br/>Please review your payment credentials and attempt the transaction again. Note that unconfirmed slots may be released.", "#FEF7F7", DANGER),
                button("Resolve Payment Issue", "http://localhost:3000/payments", DANGER)
        );
    }

    /**
     * REFUND_REQUESTED → sent to ADMIN
     */
    private String buildRefundRequested(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;">
                <p style="margin:0;color:%s;font-size:14px;line-height:1.7;">
                  A formal refund request has been submitted and requires administrative review. 
                  Please evaluate the transaction data below to process the request.
                </p>
              </td></tr>
              <tr><td style="padding:24px 36px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="background:#FFFBF0;border:1px solid #FCE8B3;border-radius:4px;padding:24px;">
                  %s
                  %s
                  %s
                  %s
                  %s
                </table>
              </td></tr>
              <tr><td style="padding:0 36px 48px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading(null, "Refund Case Review", WARNING),
                TEXT_DARK,
                infoRow("Requester Name", get(data, "patientName")),
                infoRow("Account Email", get(data, "patientEmail")),
                infoRow("Transaction Date", get(data, "appointmentTime")),
                infoRow("Requested Amount", get(data, "currency") + " " + get(data, "amount")),
                infoRow("Requester Case", get(data, "refundReason")),
                button("Access Administrative Panel", "http://localhost:3000/admin/refunds", WARNING)
        );
    }

    /**
     * REFUND_PROCESSED → sent to PATIENT
     */
    private String buildRefundProcessed(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:32px 36px 0;text-align:center;">
                <p style="margin:0;font-size:26px;font-weight:600;color:%s;">
                  Refund Approved: %s %s
                </p>
                <p style="margin:8px 0 0;color:%s;font-size:13px;line-height:1.5;">
                  The funds have been released and should appear in your statement within 3–5 business days.
                </p>
              </td></tr>
              <tr><td style="padding:24px 36px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="background:%s;border:1px solid #EEEEEE;border-radius:4px;padding:24px;">
                  %s
                  %s
                  %s
                </table>
              </td></tr>
              <tr><td style="padding:0 36px 48px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading(null, "Refund Settlement Confirmation", SUCCESS),
                SUCCESS, get(data, "currency"), get(data, "amount"), TEXT_LIGHT,
                BG,
                infoRow("Recipient", get(data, "patientName")),
                infoRow("Service Date", get(data, "appointmentTime")),
                infoRow("Reference Number", get(data, "transactionId")),
                calloutBox("Notice: The refund transaction has been finalized. We value your engagement with the platform.", "#F1F9F4", SUCCESS)
        );
    }

    /**
     * PRESCRIPTION_ISSUED → sent to PATIENT
     */
    private String buildPrescriptionIssued(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;">
                <p style="margin:0;color:%s;font-size:14px;line-height:1.7;">
                  A digital prescription has been formally issued following your recent consultation. 
                  You may access and download the official document from the patient portal.
                </p>
              </td></tr>
              <tr><td style="padding:24px 36px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="background:%s;border:1px solid #EEEEEE;border-radius:4px;padding:24px;">
                  %s
                  %s
                  %s
                </table>
              </td></tr>
              <tr><td style="padding:0 36px;">
                %s
              </td></tr>
              <tr><td style="padding:24px 36px 48px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading(null, "Prescription Issuance Notice", PRIMARY),
                TEXT_DARK,
                BG,
                infoRow("Issuing Provider", get(data, "doctorName") + " (" + get(data, "doctorSpecialty") + ")"),
                infoRow("Consultation Date", get(data, "appointmentTime")),
                infoRow("Clinical Notes", get(data, "prescriptionDetails")),
                calloutBox("<strong>Important Protocol:</strong> Please utilize these instructions strictly as prescribed. Authenticate into the portal to download the secure copy.", "#FFFBF0", WARNING),
                button("View Digital Prescription", "http://localhost:3000/prescriptions", PRIMARY)
        );
    }

    /**
     * DOC_APPROVED → sent to DOCTOR
     */
    private String buildDocApproved(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:24px 36px 0;text-align:left;">
                <p style="margin:0;color:%s;font-size:14px;line-height:1.7;">
                  Formal verification for <strong>%s</strong> has been completed. 
                  Your account has been granted full provider privileges across the CareLabs network.
                </p>
              </td></tr>
              <tr><td style="padding:24px 36px;">
                %s
              </td></tr>
              <tr><td style="padding:0 36px 48px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading(null, "Credential Verification Successful", SUCCESS),
                TEXT_DARK, get(data, "doctorName"),
                calloutBox("Status: Your professional profile is now active and discoverable. Please ensure your availability parameters and consultation rates are finalized in the management console.", "#F1F9F4", SUCCESS),
                button("Configure Provider Settings", "http://localhost:3000/doctor/dashboard", SUCCESS)
        );
    }

    /**
     * DOC_REJECTED → sent to DOCTOR
     */
    private String buildDocRejected(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;">
                <p style="margin:0;color:%s;font-size:14px;line-height:1.7;">
                  An update regarding the credentialing process for <strong>%s</strong>: 
                  The administrative team is currently unable to verify the provided documentation.
                </p>
              </td></tr>
              <tr><td style="padding:12px 36px;">
                %s
              </td></tr>
              <tr><td style="padding:0 36px 48px;">
                <p style="margin:0 0 16px;color:%s;font-size:13px;line-height:1.6;">
                  Please ensure all submitted documentation is up-to-date and clearly legible before resubmitting. 
                  Contact professional support if you require clarification.
                </p>
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading(null, "Credentialing Update", DANGER),
                TEXT_DARK, get(data, "doctorName"),
                calloutBox("<strong>Verification Audit Result:</strong> " + get(data, "rejectionReason"), "#FEF7F7", DANGER),
                TEXT_LIGHT,
                button("Resubmit Documentation", "http://localhost:3000/doctor/profile", PRIMARY)
        );
    }

    /**
     * PAYOUT_PROCESSED → sent to DOCTOR
     */
    private String buildPayoutProcessed(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:32px 36px 0;text-align:center;">
                <p style="margin:0;font-size:26px;font-weight:600;color:%s;">
                  Payout Released: %s %s
                </p>
                <p style="margin:8px 0 0;color:%s;font-size:13px;font-weight:600;text-transform:uppercase;">Remittance Verified</p>
              </td></tr>
              <tr><td style="padding:24px 36px;">
                <table width="100%%" cellpadding="0" cellspacing="0"
                       style="background:%s;border:1px solid #EEEEEE;border-radius:4px;padding:24px;">
                  %s
                  %s
                  %s
                </table>
              </td></tr>
              <tr><td style="padding:0 36px 48px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading(null, "Merchant Remittance Confirmation", SUCCESS),
                SUCCESS, get(data, "currency"), get(data, "amount"), TEXT_LIGHT,
                BG,
                infoRow("Recipient Account", get(data, "doctorName")),
                infoRow("Institution", get(data, "bankName")),
                infoRow("Account Identifier", "****" + get(data, "accountNumber").replaceAll(".*(.{4})$", "$1")),
                calloutBox("Notice: The remittance has been processed. Availability of funds depends on your financial institution's clearing policy.", "#F1F9F4", SUCCESS)
        );
    }

    /**
     * ANNOUNCEMENT → sent to broad role (ALL, DOCTOR, PATIENT)
     */
    private String buildAnnouncement(Map<String, String> data) {
        return """
            <table width="100%%" cellpadding="0" cellspacing="0">
              %s
              <tr><td style="padding:16px 36px 0;">
                <p style="margin:0;color:%s;font-size:14px;line-height:1.7;">
                   %s
                </p>
              </td></tr>
              <tr><td style="padding:32px 36px 48px;">
                %s
              </td></tr>
            </table>
            """.formatted(
                sectionHeading(null, get(data, "title"), PRIMARY),
                TEXT_DARK,
                get(data, "message"),
                button("Authenticate to Dashboard", "http://localhost:3000/dashboard", PRIMARY)
        );
    }
}