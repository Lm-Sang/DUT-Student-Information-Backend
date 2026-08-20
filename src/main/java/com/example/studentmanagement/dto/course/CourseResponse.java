package com.example.studentmanagement.dto.course;

import com.example.studentmanagement.entity.CourseStatus;

public record CourseResponse(Long id, String courseCode, String courseName, String description,
                             Integer credits, String department, Integer maxStudents,
                             Integer currentStudents, String semester, String academicYear,
                             CourseStatus status) {
}
