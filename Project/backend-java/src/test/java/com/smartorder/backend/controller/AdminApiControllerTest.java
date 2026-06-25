package com.smartorder.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartorder.backend.dto.UserRequest;
import com.smartorder.backend.enums.UserStatus;
import com.smartorder.backend.enums.UserType;
import com.smartorder.backend.dto.UserResponse;
import com.smartorder.backend.service.AdminService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

@WebMvcTest(controllers = AdminApiController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
public class AdminApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminService adminService;

    @MockBean
    private com.smartorder.backend.util.WebhookNotifier webhookNotifier;

    @Test
    public void testCreateStaffWithCorrectEnum() throws Exception {
        UserRequest request = new UserRequest();
        request.setLoginId("test-staff");
        request.setPassword("password123");
        request.setUserType(UserType.STAFF);
        request.setStatus(UserStatus.ACTIVE);

        UserResponse mockResponse = UserResponse.builder()
            .userId(1L)
            .loginId("test-staff")
            .userType(UserType.STAFF)
            .status(UserStatus.ACTIVE)
            .build();

        when(adminService.createStaff(any(UserRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/admin/staff")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.loginId").value("test-staff"));
    }
}
