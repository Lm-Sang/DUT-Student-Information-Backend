package com.example.studentmanagement.dto.grade;

import jakarta.validation.constraints.*;

public record GradeRequest(
        @NotNull Long studentId,
        @NotNull Long courseId,
        @NotNull @DecimalMin("0.0") @DecimalMax("10.0") Double midtermScore,
        @NotNull @DecimalMin("0.0") @DecimalMax("10.0") Double finalScore,
        @NotBlank String semester,
        @NotBlank String academicYear
) {
}
