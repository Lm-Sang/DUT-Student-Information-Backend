package com.example.studentmanagement.repository;

import com.example.studentmanagement.entity.Notification;
import com.example.studentmanagement.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByTargetRole(Role role);
}
