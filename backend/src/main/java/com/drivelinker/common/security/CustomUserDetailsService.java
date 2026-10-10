package com.drivelinker.common.security;

import com.drivelinker.user.entity.User;
import com.drivelinker.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.Collections;

/**
 * Service tích hợp với Spring Security để lấy thông tin User từ Database phục vụ xác thực.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @org.springframework.transaction.annotation.Transactional
    public UserDetails loadUserByUsername(String compositeUsername) throws UsernameNotFoundException {
        
        String[] parts = compositeUsername.split(":");
        if (parts.length != 2) {
            throw new UsernameNotFoundException("Invalid username format");
        }
        
        Integer orgId = Integer.parseInt(parts[0]);
        String username = parts[1];

        User user = userRepository.findByOrganizationIdAndUsername(orgId, username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new UsernameNotFoundException("User is disabled");
        }

        return new org.springframework.security.core.userdetails.User(user.getId().toString(), user.getPasswordHash(),
                Collections.singleton(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName())));
    }

}
