package com.example.studentmanagement.util;

import lombok.Builder;

import java.time.Instant;

@Builder
public record ApiResponse<T>(boolean success, String message, T data, Instant timestamp) {
    public static <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder().success(true).message(message).data(data).timestamp(Instant.now()).build();
    }

    public static <T> ApiResponse<T> fail(String message) {
        return ApiResponse.<T>builder().success(false).message(message).data(null).timestamp(Instant.now()).build();
    }
}
