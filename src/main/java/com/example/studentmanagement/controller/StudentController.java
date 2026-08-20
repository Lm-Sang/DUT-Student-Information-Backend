package com.example.studentmanagement.controller;

import com.example.studentmanagement.dto.student.StudentRequest;
import com.example.studentmanagement.mapper.StudentMapper;
import com.example.studentmanagement.service.CurrentUserService;
import com.example.studentmanagement.service.StudentService;
import com.example.studentmanagement.util.ApiResponse;
import com.example.studentmanagement.util.PageData;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/students")
public class StudentController {
    private final StudentService studentService;
    private final StudentMapper studentMapper;
    private final CurrentUserService currentUserService;

    public StudentController(StudentService studentService, StudentMapper studentMapper, CurrentUserService currentUserService) {
        this.studentService = studentService;
        this.studentMapper = studentMapper;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<?> me() {
        return ApiResponse.ok("Student profile retrieved", studentMapper.toResponse(studentService.getMe(currentUserService.getCurrentStudent())));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<?> get(@PathVariable Long id) {
        return ApiResponse.ok("Student retrieved", studentMapper.toResponse(studentService.getById(id)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<?> list(@RequestParam(required = false) String keyword,
                               @RequestParam(defaultValue = "0") int page,
                               @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        var mapped = studentService.getAll(keyword, pageable).map(studentMapper::toResponse);
        return ApiResponse.ok("Students retrieved successfully", PageData.from(mapped));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<?> create(@Valid @RequestBody StudentRequest request) {
        return ApiResponse.ok("Student created", studentMapper.toResponse(studentService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<?> update(@PathVariable Long id, @Valid @RequestBody StudentRequest request) {
        return ApiResponse.ok("Student updated", studentMapper.toResponse(studentService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        studentService.delete(id);
        return ApiResponse.ok("Student deleted", null);
    }
}
