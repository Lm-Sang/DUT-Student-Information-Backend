package com.example.studentmanagement.service;

import com.example.studentmanagement.config.AppProperties;
import com.example.studentmanagement.dto.grade.GradeRequest;
import com.example.studentmanagement.dto.grade.GradeSummaryResponse;
import com.example.studentmanagement.entity.Grade;
import com.example.studentmanagement.exception.ResourceNotFoundException;
import com.example.studentmanagement.repository.CourseRepository;
import com.example.studentmanagement.repository.GradeRepository;
import com.example.studentmanagement.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GradeService {
    private final GradeRepository gradeRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final AppProperties properties;

    public GradeService(GradeRepository gradeRepository, StudentRepository studentRepository,
                        CourseRepository courseRepository, AppProperties properties) {
        this.gradeRepository = gradeRepository;
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.properties = properties;
    }

    public List<Grade> getMyGrades(Long studentId) {
        return gradeRepository.findByStudentId(studentId);
    }

    public GradeSummaryResponse getSummary(Long studentId) {
        List<Grade> grades = getMyGrades(studentId);
        int totalCredits = grades.stream().mapToInt(g -> g.getCourse().getCredits()).sum();
        int completedCredits = grades.stream().filter(g -> g.getTotalScore() >= 5.0).mapToInt(g -> g.getCourse().getCredits()).sum();
        double weighted = grades.stream().mapToDouble(g -> g.getCourse().getCredits() * toGradePoint(g.getLetterGrade())).sum();
        double gpa = totalCredits == 0 ? 0.0 : weighted / totalCredits;
        return new GradeSummaryResponse(Math.round(gpa * 100.0) / 100.0, totalCredits, completedCredits);
    }

    public Grade create(GradeRequest request) {
        Grade g = new Grade();
        g.setStudent(studentRepository.findById(request.studentId()).orElseThrow(() -> new ResourceNotFoundException("Student not found")));
        g.setCourse(courseRepository.findById(request.courseId()).orElseThrow(() -> new ResourceNotFoundException("Course not found")));
        g.setMidtermScore(request.midtermScore());
        g.setFinalScore(request.finalScore());
        g.setSemester(request.semester());
        g.setAcademicYear(request.academicYear());
        applyScale(g);
        return gradeRepository.save(g);
    }

    public Grade update(Long id, GradeRequest request) {
        Grade g = gradeRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Grade not found"));
        g.setMidtermScore(request.midtermScore());
        g.setFinalScore(request.finalScore());
        g.setSemester(request.semester());
        g.setAcademicYear(request.academicYear());
        applyScale(g);
        return gradeRepository.save(g);
    }

    private void applyScale(Grade g) {
        double total = g.getMidtermScore() * properties.grade().midtermWeight() + g.getFinalScore() * properties.grade().finalWeight();
        g.setTotalScore(Math.round(total * 100.0) / 100.0);
        g.setLetterGrade(toLetter(total));
    }

    private String toLetter(double total) {
        if (total >= 8.5) return "A";
        if (total >= 7.0) return "B";
        if (total >= 5.5) return "C";
        if (total >= 4.0) return "D";
        return "F";
    }

    private double toGradePoint(String letter) {
        return switch (letter) {
            case "A" -> 4.0;
            case "B" -> 3.0;
            case "C" -> 2.0;
            case "D" -> 1.0;
            default -> 0.0;
        };
    }
}
