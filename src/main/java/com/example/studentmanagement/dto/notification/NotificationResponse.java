package com.example.studentmanagement.dto.notification;

import com.example.studentmanagement.entity.NotificationType;
import com.example.studentmanagement.entity.Role;

import java.time.Instant;

public record NotificationResponse(Long id, String title, String content, NotificationType type,
                                   Instant createdAt, Instant publishedAt, Role targetRole, boolean isRead) {
}
