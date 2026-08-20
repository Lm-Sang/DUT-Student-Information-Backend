package com.example.studentmanagement.dto.course;

import com.example.studentmanagement.entity.CourseStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CourseRequest(
        @NotBlank String courseCode,
        @NotBlank String courseName,
        String description,
        @NotNull @Positive Integer credits,
        @NotBlank String department,
        @NotNull @Positive Integer maxStudents,
        @NotBlank String semester,
        @NotBlank String academicYear,
        @NotNull CourseStatus status
) {
}
