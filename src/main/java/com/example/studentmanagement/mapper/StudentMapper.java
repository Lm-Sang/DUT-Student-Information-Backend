package com.example.studentmanagement.mapper;

import com.example.studentmanagement.dto.student.StudentResponse;
import com.example.studentmanagement.entity.Student;
import org.springframework.stereotype.Component;

@Component
public class StudentMapper {
    public StudentResponse toResponse(Student s) {
        return new StudentResponse(s.getId(), s.getStudentCode(), s.getFullName(), s.getDateOfBirth(), s.getGender(),
                s.getEmail(), s.getPhone(), s.getAddress(), s.getClassName(), s.getMajor(), s.getAcademicYear(),
                s.getEnrollmentDate(), s.getStatus());
    }
}
