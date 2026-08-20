package com.example.studentmanagement.service;

import com.example.studentmanagement.dto.schedule.ScheduleRequest;
import com.example.studentmanagement.entity.Exam;
import com.example.studentmanagement.entity.Schedule;
import com.example.studentmanagement.exception.ResourceNotFoundException;
import com.example.studentmanagement.repository.CourseRepository;
import com.example.studentmanagement.repository.ExamRepository;
import com.example.studentmanagement.repository.ScheduleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ScheduleService {
    private final ScheduleRepository scheduleRepository;
    private final ExamRepository examRepository;
    private final CourseRepository courseRepository;

    public ScheduleService(ScheduleRepository scheduleRepository, ExamRepository examRepository, CourseRepository courseRepository) {
        this.scheduleRepository = scheduleRepository;
        this.examRepository = examRepository;
        this.courseRepository = courseRepository;
    }

    public List<Schedule> listSchedules(String semester, String academicYear) {
        return scheduleRepository.findBySemesterAndAcademicYear(semester, academicYear);
    }

    public Schedule create(ScheduleRequest req) {
        Schedule schedule = new Schedule();
        schedule.setCourse(courseRepository.findById(req.courseId()).orElseThrow(() -> new ResourceNotFoundException("Course not found")));
        schedule.setClassroom(req.classroom());
        schedule.setDayOfWeek(req.dayOfWeek());
        schedule.setStartTime(req.startTime());
        schedule.setEndTime(req.endTime());
        schedule.setLecturer(req.lecturer());
        schedule.setSemester(req.semester());
        schedule.setAcademicYear(req.academicYear());
        return scheduleRepository.save(schedule);
    }

    public Schedule update(Long id, ScheduleRequest req) {
        Schedule schedule = scheduleRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Schedule not found"));
        schedule.setCourse(courseRepository.findById(req.courseId()).orElseThrow(() -> new ResourceNotFoundException("Course not found")));
        schedule.setClassroom(req.classroom());
        schedule.setDayOfWeek(req.dayOfWeek());
        schedule.setStartTime(req.startTime());
        schedule.setEndTime(req.endTime());
        schedule.setLecturer(req.lecturer());
        schedule.setSemester(req.semester());
        schedule.setAcademicYear(req.academicYear());
        return scheduleRepository.save(schedule);
    }

    public void delete(Long id) {
        scheduleRepository.deleteById(id);
    }

    public List<Exam> listExams(String semester, String academicYear) {
        return examRepository.findBySemesterAndAcademicYear(semester, academicYear);
    }
}
