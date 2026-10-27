package com.HoiAn.HA_App.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

import static org.assertj.core.api.Assertions.assertThat;

class VnPayPropertiesBindingTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(BindingConfiguration.class)
            .withPropertyValues(
                    "vnpay.tmn-code=test-merchant",
                    "vnpay.hash-secret=test-secret",
                    "vnpay.pay-url=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
                    "vnpay.return-url=http://localhost:5173",
                    "vnpay.ipn-url=https://api.example.test/api/payments/vnpay/ipn");

    @Test
    void canonicalPayUrlPropertyBindsToRecordComponent() {
        contextRunner.run(context -> {
            assertThat(context).hasSingleBean(VnPayProperties.class);
            assertThat(context.getBean(VnPayProperties.class).payUrl())
                    .isEqualTo("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");
        });
    }

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(VnPayProperties.class)
    static class BindingConfiguration {
    }
}
