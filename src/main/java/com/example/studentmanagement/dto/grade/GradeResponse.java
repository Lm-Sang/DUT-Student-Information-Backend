package com.example.studentmanagement.dto.grade;

public record GradeResponse(Long id, Long studentId, Long courseId,
                            Double midtermScore, Double finalScore, Double totalScore,
                            String letterGrade, String semester, String academicYear) {
}
