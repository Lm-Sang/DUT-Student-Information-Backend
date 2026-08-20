package com.example.studentmanagement.dto.tuition;

import com.example.studentmanagement.entity.TuitionStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TuitionResponse(Long id, Long studentId, String semester, String academicYear,
                              BigDecimal totalAmount, BigDecimal paidAmount, BigDecimal remainingAmount,
                              LocalDate dueDate, TuitionStatus status) {
}
