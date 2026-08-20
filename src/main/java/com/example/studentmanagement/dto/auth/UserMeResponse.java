package com.example.studentmanagement.dto.auth;

import com.example.studentmanagement.entity.Role;

public record UserMeResponse(Long id, String username, String email, Role role) {
}
