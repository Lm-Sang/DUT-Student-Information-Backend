package com.example.studentmanagement.repository;

import com.example.studentmanagement.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    List<Schedule> findBySemesterAndAcademicYear(String semester, String academicYear);
}
