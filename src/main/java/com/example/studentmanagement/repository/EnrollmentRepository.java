package com.example.studentmanagement.repository;

import com.example.studentmanagement.entity.Enrollment;
import com.example.studentmanagement.entity.EnrollmentStatus;
import com.example.studentmanagement.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    boolean existsByStudentIdAndCourseIdAndSemesterAndAcademicYearAndStatus(Long studentId, Long courseId, String semester, String academicYear, EnrollmentStatus status);

    List<Enrollment> findByStudentAndStatus(Student student, EnrollmentStatus status);

    Optional<Enrollment> findByIdAndStudentId(Long id, Long studentId);
}
