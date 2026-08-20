package com.example.studentmanagement.service;

import com.example.studentmanagement.dto.auth.AuthResponse;
import com.example.studentmanagement.dto.auth.LoginRequest;
import com.example.studentmanagement.dto.auth.UserMeResponse;
import com.example.studentmanagement.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final CurrentUserService currentUserService;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService, CurrentUserService currentUserService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.currentUserService = currentUserService;
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        var user = currentUserService.getCurrentUser();
        String token = jwtService.generateToken(user.getUsername(), user.getRole());
        return new AuthResponse(token, "Bearer", user.getUsername(), user.getRole());
    }

    public UserMeResponse me() {
        var user = currentUserService.getCurrentUser();
        return new UserMeResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRole());
    }
}
