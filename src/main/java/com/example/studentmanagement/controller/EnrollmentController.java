package com.example.studentmanagement.controller;

import com.example.studentmanagement.dto.enrollment.EnrollmentRequest;
import com.example.studentmanagement.mapper.EnrollmentMapper;
import com.example.studentmanagement.service.CurrentUserService;
import com.example.studentmanagement.service.EnrollmentService;
import com.example.studentmanagement.util.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/enrollments")
public class EnrollmentController {
    private final EnrollmentService enrollmentService;
    private final EnrollmentMapper mapper;
    private final CurrentUserService currentUserService;

    public EnrollmentController(EnrollmentService enrollmentService, EnrollmentMapper mapper, CurrentUserService currentUserService) {
        this.enrollmentService = enrollmentService;
        this.mapper = mapper;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<?> me() {
        return ApiResponse.ok("Enrollments retrieved", enrollmentService.getMyEnrollments(currentUserService.getCurrentStudent()).stream().map(mapper::toResponse).toList());
    }

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<?> register(@Valid @RequestBody EnrollmentRequest request) {
        return ApiResponse.ok("Enrollment created", mapper.toResponse(enrollmentService.register(currentUserService.getCurrentStudent(), request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<Void> drop(@PathVariable Long id) {
        enrollmentService.drop(currentUserService.getCurrentStudent(), id);
        return ApiResponse.ok("Enrollment dropped", null);
    }
}
