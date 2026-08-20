package com.example.studentmanagement.controller;

import com.example.studentmanagement.dto.course.CourseRequest;
import com.example.studentmanagement.mapper.CourseMapper;
import com.example.studentmanagement.service.CourseService;
import com.example.studentmanagement.util.ApiResponse;
import com.example.studentmanagement.util.PageData;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/courses")
public class CourseController {
    private final CourseService courseService;
    private final CourseMapper courseMapper;

    public CourseController(CourseService courseService, CourseMapper courseMapper) {
        this.courseService = courseService;
        this.courseMapper = courseMapper;
    }

    @GetMapping
    public ApiResponse<?> list(@RequestParam(required = false) String keyword,
                               @RequestParam(required = false) String semester,
                               @RequestParam(required = false) String department,
                               @RequestParam(required = false) String academicYear,
                               @RequestParam(defaultValue = "0") int page,
                               @RequestParam(defaultValue = "20") int size) {
        var data = courseService.list(keyword, semester, department, academicYear, PageRequest.of(page, size)).map(courseMapper::toResponse);
        return ApiResponse.ok("Courses retrieved", PageData.from(data));
    }

    @GetMapping("/{id}")
    public ApiResponse<?> get(@PathVariable Long id) {
        return ApiResponse.ok("Course retrieved", courseMapper.toResponse(courseService.get(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<?> create(@Valid @RequestBody CourseRequest request) {
        return ApiResponse.ok("Course created", courseMapper.toResponse(courseService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<?> update(@PathVariable Long id, @Valid @RequestBody CourseRequest request) {
        return ApiResponse.ok("Course updated", courseMapper.toResponse(courseService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        courseService.delete(id);
        return ApiResponse.ok("Course deleted", null);
    }
}
