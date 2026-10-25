package com.HoiAn.HA_App;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class HaAppApplication {

	public static void main(String[] args) {
		SpringApplication.run(HaAppApplication.class, args);
	}

}
