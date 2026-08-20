package com.example.studentmanagement.dto.tuition;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record TuitionPaymentRequest(
        @NotNull @Positive BigDecimal amount,
        @NotBlank String paymentMethod,
        @NotBlank String transactionCode
) {
}
