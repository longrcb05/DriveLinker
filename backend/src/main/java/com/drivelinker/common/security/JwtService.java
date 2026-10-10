package com.drivelinker.common.security;

import com.drivelinker.user.entity.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Service chịu trách nhiệm sinh (generate) và xác thực (validate) JWT Token.
 */
@Service
public class JwtService {

    @Value("${application.security.jwt.secret-key}")
    private String secretKey;

    @Value("${application.security.jwt.expiration}")
    private long jwtExpiration;

    public String generateToken(User user) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", user.getRole().getName());
        extraClaims.put("organizationId", user.getOrganization().getId());

        return Jwts.builder()
                .claims(extraClaims)
                .subject(user.getId().toString())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSignInKey())
                .compact();
    }

    public String extractUserId(String token) {
        return Jwts.parser().verifyWith(getSignInKey()).build()
                .parseSignedClaims(token).getPayload().getSubject();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        String userIdStr = extractUserId(token);
        Date expiration = Jwts.parser().verifyWith(getSignInKey()).build()
                .parseSignedClaims(token).getPayload().getExpiration();

        boolean isExpired = expiration.before(new Date());
        return (userIdStr.equals(userDetails.getUsername())) && !isExpired;
    }

    private SecretKey getSignInKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
    }
}
