package com.example.studentmanagement.dto.auth;

import com.example.studentmanagement.entity.Role;

public record AuthResponse(String accessToken, String tokenType, String username, Role role) {
}
