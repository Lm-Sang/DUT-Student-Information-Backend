package com.example.studentmanagement.service;

import com.example.studentmanagement.config.AppProperties;
import com.example.studentmanagement.dto.grade.GradeRequest;
import com.example.studentmanagement.entity.Course;
import com.example.studentmanagement.entity.Grade;
import com.example.studentmanagement.entity.Student;
import com.example.studentmanagement.repository.CourseRepository;
import com.example.studentmanagement.repository.GradeRepository;
import com.example.studentmanagement.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class GradeServiceTest {
    private GradeRepository gradeRepository;
    private StudentRepository studentRepository;
    private CourseRepository courseRepository;
    private GradeService gradeService;

    @BeforeEach
    void setUp() {
        gradeRepository = mock(GradeRepository.class);
        studentRepository = mock(StudentRepository.class);
        courseRepository = mock(CourseRepository.class);
        AppProperties props = new AppProperties("*", new AppProperties.Enrollment(1, 24, java.time.LocalDate.of(2027, 1, 31)), new AppProperties.Grade(0.4, 0.6));
        gradeService = new GradeService(gradeRepository, studentRepository, courseRepository, props);
    }

    @Test
    void shouldCalculateGradeUsingConfiguredWeights() {
        Student student = new Student();
        student.setId(1L);
        Course course = new Course();
        course.setId(2L);
        course.setCredits(3);

        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(courseRepository.findById(2L)).thenReturn(Optional.of(course));
        when(gradeRepository.save(any(Grade.class))).thenAnswer(invocation -> invocation.getArgument(0));

        GradeRequest req = new GradeRequest(1L, 2L, 8.0, 9.0, "Fall", "2026");
        Grade result = gradeService.create(req);

        assertThat(result.getTotalScore()).isEqualTo(8.6);
        assertThat(result.getLetterGrade()).isEqualTo("A");
    }
}
