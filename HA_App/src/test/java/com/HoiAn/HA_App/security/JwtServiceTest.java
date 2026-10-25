package com.HoiAn.HA_App.security;

import org.junit.jupiter.api.Test;

import com.HoiAn.HA_App.sercurity.AuthUser;
import com.HoiAn.HA_App.sercurity.JwtService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "unit-test-secret-0123456789-0123456789";

    private final AuthUser merchant = new AuthUser(7, "caolau_bamy", "MERCHANT", "MERCHANT", 3);
    private final AuthUser admin = new AuthUser(1, "admin", "SUPER_ADMIN", "ADMIN", null);
    private final AuthUser poiAdmin = new AuthUser(9, "poi-editor", "POI_ADMIN", "ADMIN", null);
    private final AuthUser merchantUser = new AuthUser(10, "merchant", "MERCHANT", "MERCHANT", 2);

    @Test
    void tokenRoundTripKeepsClaims() {
        JwtService service = new JwtService(SECRET, 60, "hoian-api");

        AuthUser parsed = service.parseToken(service.generateToken(merchant)).orElseThrow();

        assertThat(parsed).isEqualTo(merchant);
    }

    @Test
    void adminHasNoMerchantId() {
        JwtService service = new JwtService(SECRET, 60, "hoian-api");

        AuthUser parsed = service.parseToken(service.generateToken(admin)).orElseThrow();

        assertThat(parsed.merchantId()).isNull();
        assertThat(parsed.authorities()).extracting(Object::toString)
                .contains("ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_POI_ADMIN");
    }

    @Test
    void poiAdminGetsOnlyPoiModuleAuthority() {
        assertThat(poiAdmin.authorities()).extracting(Object::toString)
                .containsExactly("ROLE_POI_ADMIN");
        assertThat(merchantUser.authorities()).extracting(Object::toString)
                .containsExactly("ROLE_MERCHANT");
    }

    @Test
    void tokenSignedWithAnotherSecretIsRejected() {
        JwtService issuer = new JwtService(SECRET, 60, "hoian-api");
        JwtService other = new JwtService("another-secret-0123456789-0123456789", 60, "hoian-api");

        assertThat(other.parseToken(issuer.generateToken(admin))).isEmpty();
    }

    @Test
    void expiredTokenIsRejected() {
        JwtService service = new JwtService(SECRET, -1, "hoian-api");

        assertThat(service.parseToken(service.generateToken(admin))).isEmpty();
    }

    @Test
    void tokenFromAnotherIssuerIsRejected() {
        JwtService a = new JwtService(SECRET, 60, "issuer-a");
        JwtService b = new JwtService(SECRET, 60, "issuer-b");

        assertThat(b.parseToken(a.generateToken(admin))).isEmpty();
    }

    @Test
    void garbageTokenIsRejected() {
        JwtService service = new JwtService(SECRET, 60, "hoian-api");

        assertThat(service.parseToken("not-a-jwt")).isEmpty();
        assertThat(service.parseToken("")).isEmpty();
    }

    @Test
    void shortSecretIsRefused() {
        assertThatThrownBy(() -> new JwtService("too-short", 60, "hoian-api"))
                .isInstanceOf(IllegalStateException.class);
    }
}
