package com.example.studentmanagement.mapper;

import com.example.studentmanagement.dto.course.CourseResponse;
import com.example.studentmanagement.entity.Course;
import org.springframework.stereotype.Component;

@Component
public class CourseMapper {
    public CourseResponse toResponse(Course c) {
        return new CourseResponse(c.getId(), c.getCourseCode(), c.getCourseName(), c.getDescription(), c.getCredits(),
                c.getDepartment(), c.getMaxStudents(), c.getCurrentStudents(), c.getSemester(), c.getAcademicYear(), c.getStatus());
    }
}
