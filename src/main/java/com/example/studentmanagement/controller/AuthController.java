package com.example.studentmanagement.controller;

import com.example.studentmanagement.dto.auth.LoginRequest;
import com.example.studentmanagement.service.AuthService;
import com.example.studentmanagement.util.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<?> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Login successful", authService.login(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        return ApiResponse.ok("Logout successful", null);
    }

    @GetMapping("/me")
    public ApiResponse<?> me() {
        return ApiResponse.ok("User profile retrieved", authService.me());
    }
}
