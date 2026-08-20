package com.example.studentmanagement.controller;

import com.example.studentmanagement.dto.grade.GradeRequest;
import com.example.studentmanagement.mapper.GradeMapper;
import com.example.studentmanagement.service.CurrentUserService;
import com.example.studentmanagement.service.GradeService;
import com.example.studentmanagement.util.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class GradeController {
    private final GradeService gradeService;
    private final CurrentUserService currentUserService;
    private final GradeMapper gradeMapper;

    public GradeController(GradeService gradeService, CurrentUserService currentUserService, GradeMapper gradeMapper) {
        this.gradeService = gradeService;
        this.currentUserService = currentUserService;
        this.gradeMapper = gradeMapper;
    }

    @GetMapping("/grades/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<?> myGrades() {
        Long studentId = currentUserService.getCurrentStudent().getId();
        return ApiResponse.ok("Grades retrieved", gradeService.getMyGrades(studentId).stream().map(gradeMapper::toResponse).toList());
    }

    @GetMapping("/grades/me/summary")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<?> mySummary() {
        Long studentId = currentUserService.getCurrentStudent().getId();
        return ApiResponse.ok("Grade summary retrieved", gradeService.getSummary(studentId));
    }

    @GetMapping("/students/{studentId}/grades")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<?> studentGrades(@PathVariable Long studentId) {
        return ApiResponse.ok("Grades retrieved", gradeService.getMyGrades(studentId).stream().map(gradeMapper::toResponse).toList());
    }

    @PostMapping("/grades")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<?> create(@Valid @RequestBody GradeRequest request) {
        return ApiResponse.ok("Grade created", gradeMapper.toResponse(gradeService.create(request)));
    }

    @PutMapping("/grades/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<?> update(@PathVariable Long id, @Valid @RequestBody GradeRequest request) {
        return ApiResponse.ok("Grade updated", gradeMapper.toResponse(gradeService.update(id, request)));
    }
}
