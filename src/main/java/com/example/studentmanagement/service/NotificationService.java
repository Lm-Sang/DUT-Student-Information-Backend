package com.example.studentmanagement.service;

import com.example.studentmanagement.dto.notification.NotificationRequest;
import com.example.studentmanagement.entity.Notification;
import com.example.studentmanagement.exception.ResourceNotFoundException;
import com.example.studentmanagement.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public List<Notification> listForRole(com.example.studentmanagement.entity.Role role) {
        return notificationRepository.findByTargetRole(role);
    }

    public Notification get(Long id) {
        return notificationRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
    }

    public Notification create(NotificationRequest request) {
        Notification n = new Notification();
        n.setTitle(request.title());
        n.setContent(request.content());
        n.setType(request.type());
        n.setTargetRole(request.targetRole());
        n.setPublishedAt(Instant.now());
        n.setRead(false);
        return notificationRepository.save(n);
    }

    public Notification markRead(Long id) {
        Notification n = get(id);
        n.setRead(true);
        return notificationRepository.save(n);
    }

    public void delete(Long id) {
        notificationRepository.deleteById(id);
    }
}
