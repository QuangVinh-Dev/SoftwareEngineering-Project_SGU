package com.HoiAn.HA_App.util;

import java.util.Map;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class VnPayUtilTest {
    @Test
    void canonicalParametersUseSortedKeysAndOneFormEncodingPass() {
        Map<String, String> params = Map.of(
                "vnp_ReturnUrl", "http://localhost:5173/?a=1&b=two words",
                "vnp_OrderInfo", "Thanh toan: 20000",
                "vnp_Amount", "2000000");
        String expected = "vnp_Amount=2000000&vnp_OrderInfo=Thanh+toan%3A+20000"
                + "&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A5173%2F%3Fa%3D1%26b%3Dtwo+words";

        assertThat(VnPayUtil.buildHashData(params)).isEqualTo(expected);
        assertThat(VnPayUtil.buildQueryString(params)).isEqualTo(expected);
    }

    @Test
    void hmacSha512MatchesRfc4231TestVector() {
        // RFC 4231 case 1: public test data, not a merchant credential.
        assertThat(VnPayUtil.hmacSha512("\u000b".repeat(20), "Hi There"))
                .isEqualTo("87aa7cdea5ef619d4ff0b4241a1d6cb02379f4e2ce4ec2787ad0b30545e17cde"
                        + "daa833b7d6b8a702038b274eaea3f4e4be9d914eeb61f1702e696c203a126854");
    }
}
