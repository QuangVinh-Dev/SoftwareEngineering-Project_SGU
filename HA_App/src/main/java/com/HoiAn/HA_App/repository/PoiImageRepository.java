package com.HoiAn.HA_App.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class PoiImageRepository {
    private final JdbcTemplate jdbc;

    public PoiImageRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<String> findPaths(Integer poiId) {
        return jdbc.query("SELECT file_path FROM poi_image WHERE poi_id=? ORDER BY order_num, id",
                (rs, row) -> rs.getString("file_path"), poiId);
    }

    public int count(Integer poiId) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM poi_image WHERE poi_id=?", Integer.class, poiId);
        return count == null ? 0 : count;
    }

    public void lockPoi(Integer poiId) {
        jdbc.queryForObject("SELECT id FROM poi WHERE id=? FOR UPDATE", Integer.class, poiId);
    }

    public void add(Integer poiId, String path, int order) {
        jdbc.update("INSERT INTO poi_image(poi_id,file_path,order_num) VALUES(?,?,?)", poiId, path, order);
    }
}
