package com.drivelinker.vehicle;

import com.drivelinker.auth.dto.LoginRequest;
import com.drivelinker.organization.entity.Organization;
import com.drivelinker.organization.repository.OrganizationRepository;
import com.drivelinker.user.entity.User;
import com.drivelinker.user.repository.UserRepository;
import com.drivelinker.vehicle.entity.Vehicle;
import com.drivelinker.vehicle.repository.VehicleRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class MultiTenantDataIsolationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OrganizationRepository orgRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    private String tokenOrg1;
    private String tokenOrg2;

    @BeforeEach
    public void setup() throws Exception {
        com.drivelinker.user.entity.Role role = new com.drivelinker.user.entity.Role();
        role.setName("ROLE_ADMIN_ISO");
        entityManager.persist(role);

        Organization org1 = new Organization();
        org1.setCompanyCode("ISO_ORG_1");
        org1.setName("Iso Company 1");
        org1.setStatus("ACTIVE");
        org1 = orgRepository.save(org1);

        Organization org2 = new Organization();
        org2.setCompanyCode("ISO_ORG_2");
        org2.setName("Iso Company 2");
        org2.setStatus("ACTIVE");
        org2 = orgRepository.save(org2);

        User user1 = new User();
        user1.setOrganization(org1);
        user1.setUsername("admin");
        user1.setPasswordHash(passwordEncoder.encode("123456"));
        user1.setFullName("Admin Iso 1");
        user1.setRole(role);
        user1.setStatus("ACTIVE");
        userRepository.save(user1);

        User user2 = new User();
        user2.setOrganization(org2);
        user2.setUsername("admin");
        user2.setPasswordHash(passwordEncoder.encode("123456"));
        user2.setFullName("Admin Iso 2");
        user2.setRole(role);
        user2.setStatus("ACTIVE");
        userRepository.save(user2);

        // Tạo 2 Xe cho Org 1
        Vehicle v1 = new Vehicle();
        v1.setOrganization(org1);
        v1.setLicensePlate("43A-11111");
        v1.setBrand("TOYOTA");
        v1.setVehicleType("CAR");
        v1.setModel("VIOS");
        v1.setStatus("AVAILABLE");
        vehicleRepository.save(v1);

        Vehicle v2 = new Vehicle();
        v2.setOrganization(org1);
        v2.setLicensePlate("43A-22222");
        v2.setBrand("HONDA");
        v2.setVehicleType("CAR");
        v2.setModel("CITY");
        v2.setStatus("AVAILABLE");
        vehicleRepository.save(v2);

        // Tạo 1 Xe cho Org 2
        Vehicle v3 = new Vehicle();
        v3.setOrganization(org2);
        v3.setLicensePlate("43A-33333");
        v3.setBrand("KIA");
        v3.setVehicleType("CAR");
        v3.setModel("MORNING");
        v3.setStatus("AVAILABLE");
        vehicleRepository.save(v3);

        // Đăng nhập lấy Token cho Org 1
        LoginRequest req1 = new LoginRequest();
        req1.setCompanyCode("ISO_ORG_1");
        req1.setUsername("admin");
        req1.setPassword("123456");

        MvcResult res1 = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req1)))
                .andReturn();
        JsonNode json1 = objectMapper.readTree(res1.getResponse().getContentAsString());
        tokenOrg1 = json1.get("data").get("token").asText();

        // Đăng nhập lấy Token cho Org 2
        LoginRequest req2 = new LoginRequest();
        req2.setCompanyCode("ISO_ORG_2");
        req2.setUsername("admin");
        req2.setPassword("123456");

        MvcResult res2 = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req2)))
                .andReturn();
        JsonNode json2 = objectMapper.readTree(res2.getResponse().getContentAsString());
        tokenOrg2 = json2.get("data").get("token").asText();
    }

    @Test
    public void testDataIsolation_GetVehicles_Org1() throws Exception {
        mockMvc.perform(get("/api/vehicles")
                .header("Authorization", "Bearer " + tokenOrg1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].licensePlate").value("43A-11111"))
                .andExpect(jsonPath("$.data[1].licensePlate").value("43A-22222"));
    }

    @Test
    public void testDataIsolation_GetVehicles_Org2() throws Exception {
        mockMvc.perform(get("/api/vehicles")
                .header("Authorization", "Bearer " + tokenOrg2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].licensePlate").value("43A-33333"));
    }
}
