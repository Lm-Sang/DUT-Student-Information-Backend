package com.example.studentmanagement.controller;

import com.example.studentmanagement.service.AdminDashboardService;
import com.example.studentmanagement.util.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {
    private final AdminDashboardService adminDashboardService;

    public AdminController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<?> dashboard() {
        return ApiResponse.ok("Dashboard statistics retrieved", adminDashboardService.getStats());
    }
}
