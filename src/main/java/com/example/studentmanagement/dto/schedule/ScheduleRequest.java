package com.example.studentmanagement.dto.schedule;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record ScheduleRequest(
        @NotNull Long courseId,
        @NotBlank String classroom,
        @NotNull DayOfWeek dayOfWeek,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @NotBlank String lecturer,
        @NotBlank String semester,
        @NotBlank String academicYear
) {
}
