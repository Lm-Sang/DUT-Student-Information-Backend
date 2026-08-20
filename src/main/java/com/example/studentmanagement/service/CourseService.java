package com.example.studentmanagement.service;

import com.example.studentmanagement.dto.course.CourseRequest;
import com.example.studentmanagement.entity.Course;
import com.example.studentmanagement.exception.ResourceNotFoundException;
import com.example.studentmanagement.repository.CourseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class CourseService {
    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    public Page<Course> list(String keyword, String semester, String department, String academicYear, Pageable pageable) {
        return courseRepository.search(blankToNull(keyword), blankToNull(semester), blankToNull(department), blankToNull(academicYear), pageable);
    }

    public Course get(Long id) {
        return courseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Course not found"));
    }

    public Course create(CourseRequest req) {
        Course c = new Course();
        apply(req, c);
        c.setCurrentStudents(0);
        return courseRepository.save(c);
    }

    public Course update(Long id, CourseRequest req) {
        Course c = get(id);
        int current = c.getCurrentStudents();
        apply(req, c);
        c.setCurrentStudents(current);
        return courseRepository.save(c);
    }

    public void delete(Long id) {
        courseRepository.delete(get(id));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private void apply(CourseRequest req, Course c) {
        c.setCourseCode(req.courseCode());
        c.setCourseName(req.courseName());
        c.setDescription(req.description());
        c.setCredits(req.credits());
        c.setDepartment(req.department());
        c.setMaxStudents(req.maxStudents());
        c.setSemester(req.semester());
        c.setAcademicYear(req.academicYear());
        c.setStatus(req.status());
    }
}
