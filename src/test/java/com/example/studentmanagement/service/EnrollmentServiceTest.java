package com.example.studentmanagement.service;

import com.example.studentmanagement.config.AppProperties;
import com.example.studentmanagement.dto.enrollment.EnrollmentRequest;
import com.example.studentmanagement.entity.*;
import com.example.studentmanagement.exception.BusinessException;
import com.example.studentmanagement.repository.CourseRepository;
import com.example.studentmanagement.repository.EnrollmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class EnrollmentServiceTest {
    private EnrollmentRepository enrollmentRepository;
    private CourseRepository courseRepository;
    private EnrollmentService enrollmentService;

    @BeforeEach
    void setUp() {
        enrollmentRepository = mock(EnrollmentRepository.class);
        courseRepository = mock(CourseRepository.class);
        AppProperties props = new AppProperties("*", new AppProperties.Enrollment(1, 24, LocalDate.now().plusDays(10)), new AppProperties.Grade(0.4, 0.6));
        enrollmentService = new EnrollmentService(enrollmentRepository, courseRepository, props);
    }

    @Test
    void shouldRejectDuplicateEnrollment() {
        Student student = new Student();
        student.setId(1L);
        Course course = new Course();
        course.setId(2L);
        course.setStatus(CourseStatus.OPEN);
        course.setCredits(3);
        course.setCurrentStudents(1);
        course.setMaxStudents(10);

        when(courseRepository.findById(2L)).thenReturn(Optional.of(course));
        when(enrollmentRepository.existsByStudentIdAndCourseIdAndSemesterAndAcademicYearAndStatus(1L, 2L, "Fall", "2026", EnrollmentStatus.REGISTERED)).thenReturn(true);

        EnrollmentRequest req = new EnrollmentRequest(2L, "Fall", "2026");
        assertThrows(BusinessException.class, () -> enrollmentService.register(student, req));
    }

    @Test
    void shouldRejectWhenCourseIsFull() {
        Student student = new Student();
        student.setId(1L);
        Course course = new Course();
        course.setId(2L);
        course.setStatus(CourseStatus.OPEN);
        course.setCredits(3);
        course.setCurrentStudents(10);
        course.setMaxStudents(10);

        when(courseRepository.findById(2L)).thenReturn(Optional.of(course));

        EnrollmentRequest req = new EnrollmentRequest(2L, "Fall", "2026");
        assertThrows(BusinessException.class, () -> enrollmentService.register(student, req));
    }
}
