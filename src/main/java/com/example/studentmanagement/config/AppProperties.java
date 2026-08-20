package com.example.studentmanagement.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.LocalDate;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String corsAllowedOrigins,
        Enrollment enrollment,
        Grade grade
) {
    public record Enrollment(int minCredits, int maxCredits, LocalDate registrationDeadline) {
    }

    public record Grade(double midtermWeight, double finalWeight) {
    }
}
