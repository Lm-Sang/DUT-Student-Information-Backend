package com.example.studentmanagement.controller;

import com.example.studentmanagement.dto.tuition.TuitionPaymentRequest;
import com.example.studentmanagement.dto.tuition.TuitionRequest;
import com.example.studentmanagement.mapper.TuitionMapper;
import com.example.studentmanagement.service.CurrentUserService;
import com.example.studentmanagement.service.TuitionService;
import com.example.studentmanagement.util.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tuition")
public class TuitionController {
    private final TuitionService tuitionService;
    private final CurrentUserService currentUserService;
    private final TuitionMapper mapper;

    public TuitionController(TuitionService tuitionService, CurrentUserService currentUserService, TuitionMapper mapper) {
        this.tuitionService = tuitionService;
        this.currentUserService = currentUserService;
        this.mapper = mapper;
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<?> me() {
        Long studentId = currentUserService.getCurrentStudent().getId();
        return ApiResponse.ok("Tuition retrieved", tuitionService.myTuition(studentId).stream().map(mapper::toResponse).toList());
    }

    @GetMapping("/me/history")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<?> myHistory() {
        Long studentId = currentUserService.getCurrentStudent().getId();
        return ApiResponse.ok("Tuition history retrieved", tuitionService.myTuition(studentId).stream().map(mapper::toResponse).toList());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','STUDENT')")
    public ApiResponse<?> get(@PathVariable Long id) {
        return ApiResponse.ok("Tuition retrieved", mapper.toResponse(tuitionService.get(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<?> create(@Valid @RequestBody TuitionRequest request) {
        return ApiResponse.ok("Tuition created", mapper.toResponse(tuitionService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<?> update(@PathVariable Long id, @Valid @RequestBody TuitionRequest request) {
        return ApiResponse.ok("Tuition updated", mapper.toResponse(tuitionService.update(id, request)));
    }

    @PostMapping("/{id}/payments")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<?> addPayment(@PathVariable Long id, @Valid @RequestBody TuitionPaymentRequest request) {
        return ApiResponse.ok("Payment recorded", mapper.toResponse(tuitionService.addPayment(id, request)));
    }
}
