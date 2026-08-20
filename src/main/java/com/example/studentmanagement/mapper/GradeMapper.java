package com.example.studentmanagement.mapper;

import com.example.studentmanagement.dto.grade.GradeResponse;
import com.example.studentmanagement.entity.Grade;
import org.springframework.stereotype.Component;

@Component
public class GradeMapper {
    public GradeResponse toResponse(Grade g) {
        return new GradeResponse(g.getId(), g.getStudent().getId(), g.getCourse().getId(), g.getMidtermScore(),
                g.getFinalScore(), g.getTotalScore(), g.getLetterGrade(), g.getSemester(), g.getAcademicYear());
    }
}
