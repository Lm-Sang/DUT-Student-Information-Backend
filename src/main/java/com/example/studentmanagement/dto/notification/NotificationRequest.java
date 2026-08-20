package com.example.studentmanagement.dto.notification;

import com.example.studentmanagement.entity.NotificationType;
import com.example.studentmanagement.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record NotificationRequest(
        @NotBlank String title,
        @NotBlank String content,
        @NotNull NotificationType type,
        @NotNull Role targetRole
) {
}
