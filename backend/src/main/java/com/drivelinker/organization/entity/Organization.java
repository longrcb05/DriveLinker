package com.drivelinker.organization.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Organizations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Organization {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "OrganizationID")
    private Integer id;
    @Column(name = "Name", nullable = false)
    private String name;
    @Column(name = "Phone")
    private String phone;
    @Column(name = "Email")
    private String email;
    @Column(name = "Address")
    private String address;
    @Column(name = "Status")
    private String status;
    @Column(name = "CreatedAt", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null)
            status = "ACTIVE";
    }
}
