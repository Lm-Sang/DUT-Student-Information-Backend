package com.example.studentmanagement.config;

import com.example.studentmanagement.security.JwtProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({JwtProperties.class, AppProperties.class})
public class AppConfig {
}
