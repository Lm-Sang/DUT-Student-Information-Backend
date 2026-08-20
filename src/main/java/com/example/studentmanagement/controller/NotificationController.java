package com.example.studentmanagement.controller;

import com.example.studentmanagement.dto.notification.NotificationRequest;
import com.example.studentmanagement.mapper.NotificationMapper;
import com.example.studentmanagement.service.CurrentUserService;
import com.example.studentmanagement.service.NotificationService;
import com.example.studentmanagement.util.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;
    private final NotificationMapper mapper;

    public NotificationController(NotificationService notificationService, CurrentUserService currentUserService, NotificationMapper mapper) {
        this.notificationService = notificationService;
        this.currentUserService = currentUserService;
        this.mapper = mapper;
    }

    @GetMapping
    public ApiResponse<?> list() {
        var role = currentUserService.getCurrentUser().getRole();
        return ApiResponse.ok("Notifications retrieved", notificationService.listForRole(role).stream().map(mapper::toResponse).toList());
    }

    @GetMapping("/{id}")
    public ApiResponse<?> get(@PathVariable Long id) {
        return ApiResponse.ok("Notification retrieved", mapper.toResponse(notificationService.get(id)));
    }

    @PutMapping("/{id}/read")
    public ApiResponse<?> markRead(@PathVariable Long id) {
        return ApiResponse.ok("Notification marked as read", mapper.toResponse(notificationService.markRead(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<?> create(@Valid @RequestBody NotificationRequest request) {
        return ApiResponse.ok("Notification created", mapper.toResponse(notificationService.create(request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        notificationService.delete(id);
        return ApiResponse.ok("Notification deleted", null);
    }
}
