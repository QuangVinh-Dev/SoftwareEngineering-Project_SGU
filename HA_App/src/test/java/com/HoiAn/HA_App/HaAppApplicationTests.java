package com.HoiAn.HA_App;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
		"spring.datasource.url=jdbc:h2:mem:ha_app_context;DB_CLOSE_DELAY=-1",
		"spring.datasource.username=sa",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.jpa.defer-datasource-initialization=true",
		"spring.sql.init.mode=always",
		"spring.sql.init.data-locations=classpath:context-test-data.sql",
		"app.jwt.secret=test-only-signing-key-that-is-at-least-32-chars"
})
class HaAppApplicationTests {

	@Test
	void contextLoads() {
	}

}
