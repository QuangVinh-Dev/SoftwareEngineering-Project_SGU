package com.HoiAn.HA_App.repository;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ListeningStatsRepositoryTest {
    @Test
    void queriesTheExistingListenLogAndFiltersTrendsByMerchant() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        ListeningStatsRepository repository = new ListeningStatsRepository(jdbc);
        when(jdbc.queryForList(anyString(), any(Object[].class))).thenReturn(List.of());

        for (String range : List.of("day", "week", "month")) {
            repository.trendByMerchant(42, range);
        }

        var sql = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(jdbc, times(3)).queryForList(sql.capture(), eq(42));
        assertThat(sql.getAllValues()).allSatisfy(query -> {
            assertThat(query).contains("FROM (").contains("LEFT JOIN listen_log");
            assertThat(query).contains("SELECT id FROM poi WHERE merchant_id = ?");
            assertThat(query).doesNotContain("listening_log");
        });
        assertThat(sql.getAllValues().get(0)).contains("INTERVAL '1 hour'");
        assertThat(sql.getAllValues().get(1)).contains("INTERVAL '1 day'");
        assertThat(sql.getAllValues().get(2)).contains("29 days");
    }

    @Test
    void countsAndPoiBreakdownsUseTheAuthenticatedMerchantFilter() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        ListeningStatsRepository repository = new ListeningStatsRepository(jdbc);
        when(jdbc.queryForObject(anyString(), eq(Long.class), eq(42))).thenReturn(3L);
        when(jdbc.queryForList(anyString(), any(Object[].class))).thenReturn(List.of());

        assertThat(repository.totalByMerchant(42)).isEqualTo(3L);
        repository.poiStatsByMerchant(42, "week");

        var countSql = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(jdbc).queryForObject(countSql.capture(), eq(Long.class), eq(42));
        assertThat(countSql.getValue()).contains("FROM listen_log").contains("p.merchant_id = ?");
        var listSql = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(jdbc).queryForList(listSql.capture(), eq(42));
        assertThat(listSql.getValue()).contains("LEFT JOIN listen_log").contains("p.merchant_id = ?")
                .contains("p.approval_status = 'APPROVED'");
    }
}
