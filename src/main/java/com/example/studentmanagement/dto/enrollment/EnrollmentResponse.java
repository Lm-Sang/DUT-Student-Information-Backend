package com.example.studentmanagement.dto.enrollment;

import com.example.studentmanagement.entity.EnrollmentStatus;

import java.time.LocalDate;

public record EnrollmentResponse(Long id, Long studentId, Long courseId, String semester,
                                 String academicYear, LocalDate enrollmentDate, EnrollmentStatus status) {
}
