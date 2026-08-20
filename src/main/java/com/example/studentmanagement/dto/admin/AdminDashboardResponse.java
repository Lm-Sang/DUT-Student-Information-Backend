package com.example.studentmanagement.dto.admin;

import java.math.BigDecimal;

public record AdminDashboardResponse(
        long totalStudents,
        long activeStudents,
        long totalCourses,
        long activeCourses,
        long totalRegistrations,
        BigDecimal totalTuition,
        BigDecimal paidTuition,
        BigDecimal unpaidTuition
) {
}
