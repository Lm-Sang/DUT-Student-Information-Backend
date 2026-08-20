package com.example.studentmanagement.dto.student;

import com.example.studentmanagement.entity.StudentStatus;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record StudentRequest(
        @NotBlank String studentCode,
        @NotBlank String fullName,
        @Past LocalDate dateOfBirth,
        String gender,
        @Email @NotBlank String email,
        String phone,
        String address,
        @NotBlank String className,
        @NotBlank String major,
        @NotBlank String academicYear,
        @NotNull LocalDate enrollmentDate,
        @NotNull StudentStatus status,
        Long userId
) {
}
