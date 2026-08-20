package com.example.studentmanagement.repository;

import com.example.studentmanagement.entity.TuitionPayment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TuitionPaymentRepository extends JpaRepository<TuitionPayment, Long> {
}
