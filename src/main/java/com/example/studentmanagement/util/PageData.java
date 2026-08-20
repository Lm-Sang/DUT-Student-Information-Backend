package com.example.studentmanagement.util;

import org.springframework.data.domain.Page;

import java.util.List;

public record PageData<T>(List<T> content, int page, int size, long totalElements, int totalPages) {
    public static <T> PageData<T> from(Page<T> page) {
        return new PageData<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
