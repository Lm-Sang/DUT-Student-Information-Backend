package com.example.studentmanagement.dto.schedule;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record ScheduleResponse(Long id, Long courseId, String classroom, DayOfWeek dayOfWeek,
                               LocalTime startTime, LocalTime endTime, String lecturer,
                               String semester, String academicYear) {
}
