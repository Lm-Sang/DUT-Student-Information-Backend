package com.example.studentmanagement.service;

import com.example.studentmanagement.dto.tuition.TuitionPaymentRequest;
import com.example.studentmanagement.entity.Student;
import com.example.studentmanagement.entity.Tuition;
import com.example.studentmanagement.entity.TuitionStatus;
import com.example.studentmanagement.exception.BusinessException;
import com.example.studentmanagement.repository.StudentRepository;
import com.example.studentmanagement.repository.TuitionPaymentRepository;
import com.example.studentmanagement.repository.TuitionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TuitionServiceTest {
    private TuitionRepository tuitionRepository;
    private TuitionService tuitionService;

    @BeforeEach
    void setUp() {
        tuitionRepository = mock(TuitionRepository.class);
        StudentRepository studentRepository = mock(StudentRepository.class);
        TuitionPaymentRepository paymentRepository = mock(TuitionPaymentRepository.class);
        tuitionService = new TuitionService(tuitionRepository, studentRepository, paymentRepository);
    }

    @Test
    void shouldUpdateStatusToPaidWhenRemainingZero() {
        Tuition tuition = new Tuition();
        tuition.setId(1L);
        tuition.setTotalAmount(new BigDecimal("1000"));
        tuition.setPaidAmount(new BigDecimal("900"));
        tuition.setRemainingAmount(new BigDecimal("100"));
        tuition.setStatus(TuitionStatus.PARTIALLY_PAID);
        tuition.setStudent(new Student());

        when(tuitionRepository.findById(1L)).thenReturn(Optional.of(tuition));
        when(tuitionRepository.save(any(Tuition.class))).thenAnswer(i -> i.getArgument(0));

        Tuition result = tuitionService.addPayment(1L, new TuitionPaymentRequest(new BigDecimal("100"), "BANK", "TX-1"));

        assertThat(result.getStatus()).isEqualTo(TuitionStatus.PAID);
        assertThat(result.getRemainingAmount()).isEqualByComparingTo("0");
    }

    @Test
    void shouldRejectOverPayment() {
        Tuition tuition = new Tuition();
        tuition.setId(1L);
        tuition.setTotalAmount(new BigDecimal("1000"));
        tuition.setPaidAmount(new BigDecimal("900"));
        tuition.setRemainingAmount(new BigDecimal("100"));
        tuition.setStudent(new Student());

        when(tuitionRepository.findById(1L)).thenReturn(Optional.of(tuition));

        assertThrows(BusinessException.class,
                () -> tuitionService.addPayment(1L, new TuitionPaymentRequest(new BigDecimal("120"), "BANK", "TX-2")));
    }
}
