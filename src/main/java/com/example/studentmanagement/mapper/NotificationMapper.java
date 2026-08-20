package com.example.studentmanagement.mapper;

import com.example.studentmanagement.dto.notification.NotificationResponse;
import com.example.studentmanagement.entity.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {
    public NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(n.getId(), n.getTitle(), n.getContent(), n.getType(), n.getCreatedAt(),
                n.getPublishedAt(), n.getTargetRole(), n.isRead());
    }
}
