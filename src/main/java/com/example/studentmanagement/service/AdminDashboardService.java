package com.example.studentmanagement.service;

import com.example.studentmanagement.dto.admin.AdminDashboardResponse;
import com.example.studentmanagement.entity.CourseStatus;
import com.example.studentmanagement.entity.StudentStatus;
import com.example.studentmanagement.entity.TuitionStatus;
import com.example.studentmanagement.repository.CourseRepository;
import com.example.studentmanagement.repository.EnrollmentRepository;
import com.example.studentmanagement.repository.StudentRepository;
import com.example.studentmanagement.repository.TuitionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class AdminDashboardService {
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final TuitionRepository tuitionRepository;

    public AdminDashboardService(StudentRepository studentRepository, CourseRepository courseRepository,
                                 EnrollmentRepository enrollmentRepository, TuitionRepository tuitionRepository) {
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.tuitionRepository = tuitionRepository;
    }

    public AdminDashboardResponse getStats() {
        long totalStudents = studentRepository.count();
        long activeStudents = studentRepository.findAll().stream().filter(s -> s.getStatus() == StudentStatus.ACTIVE).count();
        long totalCourses = courseRepository.count();
        long activeCourses = courseRepository.findAll().stream().filter(c -> c.getStatus() == CourseStatus.OPEN).count();
        long totalRegistrations = enrollmentRepository.count();

        var tuition = tuitionRepository.findAll();
        BigDecimal totalTuition = tuition.stream().map(t -> t.getTotalAmount()).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal paidTuition = tuition.stream().map(t -> t.getPaidAmount()).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal unpaidTuition = tuition.stream()
                .filter(t -> t.getStatus() != TuitionStatus.PAID)
                .map(t -> t.getRemainingAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new AdminDashboardResponse(totalStudents, activeStudents, totalCourses, activeCourses, totalRegistrations,
                totalTuition, paidTuition, unpaidTuition);
    }
}
