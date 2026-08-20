package com.example.studentmanagement.service;

import com.example.studentmanagement.config.AppProperties;
import com.example.studentmanagement.dto.enrollment.EnrollmentRequest;
import com.example.studentmanagement.entity.*;
import com.example.studentmanagement.exception.BusinessException;
import com.example.studentmanagement.exception.ResourceNotFoundException;
import com.example.studentmanagement.repository.CourseRepository;
import com.example.studentmanagement.repository.EnrollmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class EnrollmentService {
    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final AppProperties properties;

    public EnrollmentService(EnrollmentRepository enrollmentRepository, CourseRepository courseRepository, AppProperties properties) {
        this.enrollmentRepository = enrollmentRepository;
        this.courseRepository = courseRepository;
        this.properties = properties;
    }

    public List<Enrollment> getMyEnrollments(Student student) {
        return enrollmentRepository.findByStudentAndStatus(student, EnrollmentStatus.REGISTERED);
    }

    @Transactional
    public Enrollment register(Student student, EnrollmentRequest request) {
        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        if (LocalDate.now().isAfter(properties.enrollment().registrationDeadline())) {
            throw new BusinessException("Registration deadline has passed");
        }
        if (course.getStatus() != CourseStatus.OPEN) {
            throw new BusinessException("Course is not open for registration");
        }
        if (course.getCurrentStudents() >= course.getMaxStudents()) {
            throw new BusinessException("Course is full");
        }
        boolean duplicate = enrollmentRepository.existsByStudentIdAndCourseIdAndSemesterAndAcademicYearAndStatus(
                student.getId(), course.getId(), request.semester(), request.academicYear(), EnrollmentStatus.REGISTERED);
        if (duplicate) {
            throw new BusinessException("Student already registered for this course in this semester");
        }

        int currentCredits = getMyEnrollments(student).stream().mapToInt(e -> e.getCourse().getCredits()).sum();
        int newCredits = currentCredits + course.getCredits();
        if (newCredits > properties.enrollment().maxCredits()) {
            throw new BusinessException("Maximum credit limit exceeded");
        }
        if (newCredits < properties.enrollment().minCredits()) {
            throw new BusinessException("Minimum credit limit not reached");
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setSemester(request.semester());
        enrollment.setAcademicYear(request.academicYear());
        enrollment.setEnrollmentDate(LocalDate.now());
        enrollment.setStatus(EnrollmentStatus.REGISTERED);

        course.setCurrentStudents(course.getCurrentStudents() + 1);
        courseRepository.save(course);
        return enrollmentRepository.save(enrollment);
    }

    @Transactional
    public void drop(Student student, Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findByIdAndStudentId(enrollmentId, student.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found"));

        if (enrollment.getStatus() == EnrollmentStatus.DROPPED) {
            return;
        }

        enrollment.setStatus(EnrollmentStatus.DROPPED);
        Course course = enrollment.getCourse();
        course.setCurrentStudents(Math.max(0, course.getCurrentStudents() - 1));
        courseRepository.save(course);
        enrollmentRepository.save(enrollment);
    }
}
