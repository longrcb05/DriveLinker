package com.drivelinker.user.repository;

import com.drivelinker.user.entity.User;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Interface thao tác CSDL cho bảng Users.
 */
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByOrganizationIdAndUsername(Integer organizationId, String username);
}
