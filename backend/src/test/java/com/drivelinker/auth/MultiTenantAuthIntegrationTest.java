package com.drivelinker.auth;

import com.drivelinker.auth.dto.LoginRequest;
import com.drivelinker.organization.entity.Organization;
import com.drivelinker.organization.repository.OrganizationRepository;
import com.drivelinker.user.entity.Role;
import com.drivelinker.user.entity.User;
import com.drivelinker.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class MultiTenantAuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OrganizationRepository orgRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    private Organization org1;
    private Organization org2;
    private Organization inactiveOrg;

    @BeforeEach
    public void setup() {
        Role role = new Role();
        role.setName("ROLE_ADMIN");
        entityManager.persist(role);

        org1 = new Organization();
        org1.setCompanyCode("TEST_ORG_1");
        org1.setName("Test Company 1");
        org1.setStatus("ACTIVE");
        org1 = orgRepository.save(org1);

        org2 = new Organization();
        org2.setCompanyCode("TEST_ORG_2");
        org2.setName("Test Company 2");
        org2.setStatus("ACTIVE");
        org2 = orgRepository.save(org2);

        inactiveOrg = new Organization();
        inactiveOrg.setCompanyCode("TEST_INACTIVE");
        inactiveOrg.setName("Inactive Company");
        inactiveOrg.setStatus("INACTIVE");
        inactiveOrg = orgRepository.save(inactiveOrg);

        User user1 = new User();
        user1.setOrganization(org1);
        user1.setUsername("testadmin");
        user1.setPasswordHash(passwordEncoder.encode("password123"));
        user1.setFullName("Admin 1");
        user1.setRole(role);
        user1.setStatus("ACTIVE");
        userRepository.save(user1);

        User user2 = new User();
        user2.setOrganization(org2);
        user2.setUsername("testadmin");
        user2.setPasswordHash(passwordEncoder.encode("differentpassword"));
        user2.setFullName("Admin 2");
        user2.setRole(role);
        user2.setStatus("ACTIVE");
        userRepository.save(user2);

        User user3 = new User();
        user3.setOrganization(inactiveOrg);
        user3.setUsername("testadmin");
        user3.setPasswordHash(passwordEncoder.encode("password123"));
        user3.setFullName("Admin 3");
        user3.setRole(role);
        user3.setStatus("ACTIVE");
        userRepository.save(user3);
    }

    @Test
    public void testLogin_Success_Company1() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setCompanyCode("TEST_ORG_1");
        req.setUsername("testadmin");
        req.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").exists())
                .andExpect(jsonPath("$.data.organizationId").value(org1.getId()));
    }

    @Test
    public void testLogin_Success_Company2_SameUsername() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setCompanyCode("TEST_ORG_2");
        req.setUsername("testadmin");
        req.setPassword("differentpassword");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").exists())
                .andExpect(jsonPath("$.data.organizationId").value(org2.getId()));
    }

    @Test
    public void testLogin_Fail_WrongCompanyCode() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setCompanyCode("WRONG_CODE");
        req.setUsername("testadmin");
        req.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin."));
    }

    @Test
    public void testLogin_Fail_InactiveCompany() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setCompanyCode("TEST_INACTIVE");
        req.setUsername("testadmin");
        req.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Tổ chức đã bị vô hiệu hóa."));
    }

    @Test
    public void testLogin_Fail_WrongPasswordForCompany() throws Exception {
        // Thử đăng nhập vào Company 1 nhưng dùng password của Company 2
        LoginRequest req = new LoginRequest();
        req.setCompanyCode("TEST_ORG_1");
        req.setUsername("testadmin");
        req.setPassword("differentpassword");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Bad credentials"));
    }
}
