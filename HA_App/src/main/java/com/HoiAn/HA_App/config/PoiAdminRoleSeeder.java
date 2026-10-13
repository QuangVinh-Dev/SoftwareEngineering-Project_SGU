package com.HoiAn.HA_App.config;

import com.HoiAn.HA_App.entity.Role;
import com.HoiAn.HA_App.repository.RoleRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PoiAdminRoleSeeder implements ApplicationRunner {
    private final RoleRepository roles;
    private final JdbcTemplate jdbc;

    public PoiAdminRoleSeeder(RoleRepository roles, JdbcTemplate jdbc) {
        this.roles = roles;
        this.jdbc = jdbc;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // Lock a stable, pre-existing row to serialize first-run role creation.
        roles.findByNameForUpdate("SUPER_ADMIN")
                .orElseThrow(() -> new IllegalStateException("Role SUPER_ADMIN is missing"));
        Role role = roles.findByName("POI_ADMIN").orElseGet(() -> {
            Role created = new Role();
            created.setName("POI_ADMIN");
            created.setDescription("Administrator for POI content and audio");
            created.setPriority(60);
            return roles.save(created);
        });
        jdbc.update("INSERT INTO role_permission(role_id, permission_code) VALUES (?, 'POI_EDIT') ON CONFLICT DO NOTHING",
                role.getId());
    }
}
