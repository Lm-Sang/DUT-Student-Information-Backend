package com.example.studentmanagement.controller;

import com.example.studentmanagement.dto.schedule.ScheduleRequest;
import com.example.studentmanagement.mapper.ScheduleMapper;
import com.example.studentmanagement.service.ScheduleService;
import com.example.studentmanagement.util.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class ScheduleController {
    private final ScheduleService scheduleService;
    private final ScheduleMapper scheduleMapper;

    public ScheduleController(ScheduleService scheduleService, ScheduleMapper scheduleMapper) {
        this.scheduleService = scheduleService;
        this.scheduleMapper = scheduleMapper;
    }

    @GetMapping("/schedules")
    public ApiResponse<?> schedules(@RequestParam String semester, @RequestParam String academicYear) {
        return ApiResponse.ok("Schedules retrieved", scheduleService.listSchedules(semester, academicYear).stream().map(scheduleMapper::toResponse).toList());
    }

    @GetMapping("/schedules/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<?> mySchedules(@RequestParam String semester, @RequestParam String academicYear) {
        return ApiResponse.ok("Schedules retrieved", scheduleService.listSchedules(semester, academicYear).stream().map(scheduleMapper::toResponse).toList());
    }

    @PostMapping("/schedules")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<?> create(@Valid @RequestBody ScheduleRequest request) {
        return ApiResponse.ok("Schedule created", scheduleMapper.toResponse(scheduleService.create(request)));
    }

    @PutMapping("/schedules/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<?> update(@PathVariable Long id, @Valid @RequestBody ScheduleRequest request) {
        return ApiResponse.ok("Schedule updated", scheduleMapper.toResponse(scheduleService.update(id, request)));
    }

    @DeleteMapping("/schedules/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        scheduleService.delete(id);
        return ApiResponse.ok("Schedule deleted", null);
    }

    @GetMapping("/exams")
    public ApiResponse<?> exams(@RequestParam String semester, @RequestParam String academicYear) {
        return ApiResponse.ok("Exams retrieved", scheduleService.listExams(semester, academicYear));
    }

    @GetMapping("/exams/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<?> myExams(@RequestParam String semester, @RequestParam String academicYear) {
        return ApiResponse.ok("Exams retrieved", scheduleService.listExams(semester, academicYear));
    }
}
