package com.example.studentmanagement.service;

import com.example.studentmanagement.dto.tuition.TuitionPaymentRequest;
import com.example.studentmanagement.dto.tuition.TuitionRequest;
import com.example.studentmanagement.entity.PaymentStatus;
import com.example.studentmanagement.entity.Tuition;
import com.example.studentmanagement.entity.TuitionPayment;
import com.example.studentmanagement.entity.TuitionStatus;
import com.example.studentmanagement.exception.BusinessException;
import com.example.studentmanagement.exception.ResourceNotFoundException;
import com.example.studentmanagement.repository.StudentRepository;
import com.example.studentmanagement.repository.TuitionPaymentRepository;
import com.example.studentmanagement.repository.TuitionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TuitionService {
    private final TuitionRepository tuitionRepository;
    private final StudentRepository studentRepository;
    private final TuitionPaymentRepository tuitionPaymentRepository;

    public TuitionService(TuitionRepository tuitionRepository, StudentRepository studentRepository,
                          TuitionPaymentRepository tuitionPaymentRepository) {
        this.tuitionRepository = tuitionRepository;
        this.studentRepository = studentRepository;
        this.tuitionPaymentRepository = tuitionPaymentRepository;
    }

    public List<Tuition> myTuition(Long studentId) {
        return tuitionRepository.findByStudentId(studentId);
    }

    public Tuition get(Long id) {
        return tuitionRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Tuition not found"));
    }

    public Tuition create(TuitionRequest request) {
        Tuition tuition = new Tuition();
        tuition.setStudent(studentRepository.findById(request.studentId()).orElseThrow(() -> new ResourceNotFoundException("Student not found")));
        tuition.setSemester(request.semester());
        tuition.setAcademicYear(request.academicYear());
        tuition.setTotalAmount(request.totalAmount());
        tuition.setPaidAmount(BigDecimal.ZERO);
        tuition.setRemainingAmount(request.totalAmount());
        tuition.setDueDate(request.dueDate());
        tuition.setStatus(TuitionStatus.UNPAID);
        return tuitionRepository.save(tuition);
    }

    public Tuition update(Long id, TuitionRequest request) {
        Tuition tuition = get(id);
        tuition.setSemester(request.semester());
        tuition.setAcademicYear(request.academicYear());
        tuition.setTotalAmount(request.totalAmount());
        tuition.setDueDate(request.dueDate());
        updateState(tuition);
        return tuitionRepository.save(tuition);
    }

    @Transactional
    public Tuition addPayment(Long tuitionId, TuitionPaymentRequest request) {
        Tuition tuition = get(tuitionId);
        if (request.amount().compareTo(tuition.getRemainingAmount()) > 0) {
            throw new BusinessException("Payment amount exceeds remaining amount");
        }
        TuitionPayment payment = new TuitionPayment();
        payment.setTuition(tuition);
        payment.setAmount(request.amount());
        payment.setPaymentDate(LocalDateTime.now());
        payment.setPaymentMethod(request.paymentMethod());
        payment.setTransactionCode(request.transactionCode());
        payment.setStatus(PaymentStatus.SUCCESS);
        tuitionPaymentRepository.save(payment);

        tuition.setPaidAmount(tuition.getPaidAmount().add(request.amount()));
        tuition.setRemainingAmount(tuition.getTotalAmount().subtract(tuition.getPaidAmount()));
        updateState(tuition);
        return tuitionRepository.save(tuition);
    }

    private void updateState(Tuition tuition) {
        tuition.setRemainingAmount(tuition.getTotalAmount().subtract(tuition.getPaidAmount()));
        if (tuition.getRemainingAmount().compareTo(BigDecimal.ZERO) <= 0) {
            tuition.setStatus(TuitionStatus.PAID);
        } else if (tuition.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            tuition.setStatus(TuitionStatus.PARTIALLY_PAID);
        } else {
            tuition.setStatus(TuitionStatus.UNPAID);
        }
    }
}
