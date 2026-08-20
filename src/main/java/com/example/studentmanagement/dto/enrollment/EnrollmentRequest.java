package com.example.studentmanagement.dto.enrollment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record EnrollmentRequest(@NotNull Long courseId, @NotBlank String semester, @NotBlank String academicYear) {
}
