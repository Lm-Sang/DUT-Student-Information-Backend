package com.example.studentmanagement.dto.student;

import com.example.studentmanagement.entity.StudentStatus;

import java.time.LocalDate;

public record StudentResponse(Long id, String studentCode, String fullName, LocalDate dateOfBirth, String gender,
                              String email, String phone, String address, String className, String major,
                              String academicYear, LocalDate enrollmentDate, StudentStatus status) {
}
