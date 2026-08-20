package com.example.studentmanagement.mapper;

import com.example.studentmanagement.dto.enrollment.EnrollmentResponse;
import com.example.studentmanagement.entity.Enrollment;
import org.springframework.stereotype.Component;

@Component
public class EnrollmentMapper {
    public EnrollmentResponse toResponse(Enrollment e) {
        return new EnrollmentResponse(e.getId(), e.getStudent().getId(), e.getCourse().getId(), e.getSemester(),
                e.getAcademicYear(), e.getEnrollmentDate(), e.getStatus());
    }
}
