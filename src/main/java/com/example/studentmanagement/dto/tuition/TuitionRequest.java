package com.example.studentmanagement.dto.tuition;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TuitionRequest(
        @NotNull Long studentId,
        @NotBlank String semester,
        @NotBlank String academicYear,
        @NotNull @Positive BigDecimal totalAmount,
        @NotNull LocalDate dueDate
) {
}
