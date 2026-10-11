package com.HoiAn.HA_App.security;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

/**
 * Tạo và kiểm tra JWT (HS256).
 */
@Service
public class JwtService {

    private final byte[] secret;
    private final long ttlSeconds;
    private final String issuer;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiration-minutes:60}") long expirationMinutes,
                      @Value("${app.jwt.issuer:hoian-api}") String issuer) {
        byte[] bytes = secret == null ? new byte[0] : secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("app.jwt.secret (JWT_SECRET) phải dài tối thiểu 32 ký tự");
        }
        this.secret = bytes;
        this.ttlSeconds = expirationMinutes * 60;
        this.issuer = issuer;
    }

    public long getTtlSeconds() {
        return ttlSeconds;
    }

    public String generateToken(AuthUser user) {
        Instant now = Instant.now();

        JWTClaimsSet.Builder claims = new JWTClaimsSet.Builder()
                .issuer(issuer)
                .subject(String.valueOf(user.id()))
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plusSeconds(ttlSeconds)))
                .claim("username", user.username())
                .claim("role", user.role())
                .claim("type", user.accountType());

        if (user.merchantId() != null) {
            claims.claim("merchantId", user.merchantId());
        }

        try {
            SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims.build());
            jwt.sign(new MACSigner(secret));
            return jwt.serialize();
        } catch (JOSEException e) {
            throw new IllegalStateException("Không ký được JWT", e);
        }
    }

    /**
     * @return thông tin user nếu token hợp lệ (đúng chữ ký, đúng issuer, chưa hết hạn), ngược lại rỗng.
     */
    public Optional<AuthUser> parseToken(String token) {
        try {
            SignedJWT jwt = SignedJWT.parse(token);

            if (!JWSAlgorithm.HS256.equals(jwt.getHeader().getAlgorithm())) {
                return Optional.empty();
            }
            if (!jwt.verify(new MACVerifier(secret))) {
                return Optional.empty();
            }

            JWTClaimsSet claims = jwt.getJWTClaimsSet();
            Date exp = claims.getExpirationTime();
            if (exp == null || exp.before(new Date())) {
                return Optional.empty();
            }
            if (!issuer.equals(claims.getIssuer())) {
                return Optional.empty();
            }

            Object merchant = claims.getClaim("merchantId");
            Integer merchantId = merchant instanceof Number n ? n.intValue() : null;

            return Optional.of(new AuthUser(
                    Integer.valueOf(claims.getSubject()),
                    claims.getStringClaim("username"),
                    claims.getStringClaim("role"),
                    claims.getStringClaim("type"),
                    merchantId
            ));
        } catch (ParseException | JOSEException | RuntimeException e) {
            return Optional.empty();
        }
    }
}
