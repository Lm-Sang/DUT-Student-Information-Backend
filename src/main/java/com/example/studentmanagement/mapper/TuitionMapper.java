package com.example.studentmanagement.mapper;

import com.example.studentmanagement.dto.tuition.TuitionResponse;
import com.example.studentmanagement.entity.Tuition;
import org.springframework.stereotype.Component;

@Component
public class TuitionMapper {
    public TuitionResponse toResponse(Tuition t) {
        return new TuitionResponse(t.getId(), t.getStudent().getId(), t.getSemester(), t.getAcademicYear(),
                t.getTotalAmount(), t.getPaidAmount(), t.getRemainingAmount(), t.getDueDate(), t.getStatus());
    }
}
