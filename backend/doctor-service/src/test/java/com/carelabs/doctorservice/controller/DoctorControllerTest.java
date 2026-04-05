package com.carelabs.doctorservice.controller;

import com.carelabs.doctorservice.entity.Doctor;
import com.carelabs.doctorservice.enums.VerificationStatus;
import com.carelabs.doctorservice.service.DoctorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class DoctorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DoctorService doctorService;

    private Doctor mockDoctor;
    private final UUID doctorUserId = UUID.randomUUID();
    private final UUID doctorId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mockDoctor = new Doctor();
        mockDoctor.setId(doctorId);
        mockDoctor.setUserId(doctorUserId);
        mockDoctor.setFullName("Dr. Test User");
        mockDoctor.setSpecialty("Cardiology");
        mockDoctor.setConsultationFee(new BigDecimal("500.00"));
        mockDoctor.setVerificationStatus(VerificationStatus.APPROVED);
        mockDoctor.setActive(true);
    }

    @Test
    void searchDoctors_Public_Success() throws Exception {
        Mockito.when(doctorService.searchDoctors(null))
                .thenReturn(Collections.singletonList(mockDoctor));

        mockMvc.perform(get("/doctors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].fullName").value("Dr. Test User"))
                .andExpect(jsonPath("$[0].specialty").value("Cardiology"));
    }

    @Test
    void getMyProfile_WithValidHeaders_Success() throws Exception {
        Mockito.when(doctorService.getDoctorByUserId(doctorUserId))
                .thenReturn(mockDoctor);

        mockMvc.perform(get("/doctors/me")
                        .header("X-Auth-User-Id", doctorUserId.toString())
                        .header("X-Auth-Role", "DOCTOR"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(doctorUserId.toString()))
                .andExpect(jsonPath("$.fullName").value("Dr. Test User"));
    }

    @Test
    void getMyProfile_MissingHeaders_Unauthorized() throws Exception {
        // Should return 403 because SecurityConfig requires authenticated state
        // and HeaderAuthenticationFilter only authenticates if both headers are present.
        mockMvc.perform(get("/doctors/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    void verifyDoctor_AdminOnly_Success() throws Exception {
        Mockito.when(doctorService.verifyDoctor(doctorId, VerificationStatus.APPROVED))
                .thenReturn(mockDoctor);

        mockMvc.perform(get("/doctors/" + doctorId + "/verify")
                        .param("status", "APPROVED")
                        .header("X-Auth-User-Id", UUID.randomUUID().toString())
                        .header("X-Auth-Role", "ADMIN"))
                .andExpect(status().isOk());
    }
}
