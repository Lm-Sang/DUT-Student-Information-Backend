package com.example.studentmanagement.mapper;

import com.example.studentmanagement.dto.schedule.ScheduleResponse;
import com.example.studentmanagement.entity.Schedule;
import org.springframework.stereotype.Component;

@Component
public class ScheduleMapper {
    public ScheduleResponse toResponse(Schedule s) {
        return new ScheduleResponse(s.getId(), s.getCourse().getId(), s.getClassroom(), s.getDayOfWeek(),
                s.getStartTime(), s.getEndTime(), s.getLecturer(), s.getSemester(), s.getAcademicYear());
    }
}
