package com.example.studentmanagement.repository;

import com.example.studentmanagement.entity.Tuition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TuitionRepository extends JpaRepository<Tuition, Long> {
    List<Tuition> findByStudentId(Long studentId);
}
