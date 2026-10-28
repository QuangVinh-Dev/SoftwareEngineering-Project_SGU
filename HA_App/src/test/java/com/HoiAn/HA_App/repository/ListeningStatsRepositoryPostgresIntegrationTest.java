package com.HoiAn.HA_App.repository;

import com.HoiAn.HA_App.service.ListeningStatsService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.JdbcTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@JdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(ListeningStatsRepository.class)
@EnabledIfSystemProperty(named = "stats.integration", matches = "true")
class ListeningStatsRepositoryPostgresIntegrationTest {
    @Autowired private JdbcTemplate jdbc;
    @Autowired private ListeningStatsRepository repository;

    private int merchantA;
    private int merchantB;

    @BeforeEach
    void assignSeedPoisToSeparateMerchants() {
        merchantA = merchantId("caolau_bamy");
        merchantB = merchantId("banhmi_phuong");
        jdbc.update("UPDATE poi SET merchant_id = ? WHERE id = 1", merchantA);
        jdbc.update("UPDATE poi SET merchant_id = ? WHERE id = 2", merchantB);
    }

    @AfterEach
    void restoreSeedPoiOwnership() {
        jdbc.update("UPDATE poi SET merchant_id = NULL WHERE id IN (1, 2)");
    }

    @Test
    void readsRealListenLogRowsAndKeepsEachMerchantIsolatedAcrossRanges() {
        ListeningStatsService service = new ListeningStatsService(repository);

        var statsA = service.getStats(merchantA, "week");
        var statsB = service.getStats(merchantB, "week");

        assertThat(statsA.totalSessions()).isEqualTo(2);
        assertThat(statsB.totalSessions()).isEqualTo(1);
        assertThat(statsA.poiStats()).extracting("poiId").containsExactly(1);
        assertThat(statsB.poiStats()).extracting("poiId").containsExactly(2);
        assertThat(service.getStats(merchantA, "day").trend())
                .anySatisfy(point -> assertThat(point.sessions()).isPositive());
        assertThat(service.getStats(merchantB, "month").trend())
                .anySatisfy(point -> assertThat(point.sessions()).isPositive());
    }

    private int merchantId(String username) {
        return jdbc.queryForObject("""
                SELECT m.id FROM merchant m
                JOIN account a ON a.id = m.account_id
                WHERE a.username = ?
                """, Integer.class, username);
    }
}
