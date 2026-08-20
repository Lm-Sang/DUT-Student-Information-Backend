package com.example.studentmanagement.repository;

import com.example.studentmanagement.entity.Student;
import com.example.studentmanagement.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByUser(User user);

    @Query("""
            select s from Student s
            where (:keyword is null or
                   lower(s.studentCode) like lower(concat('%', :keyword, '%')) or
                   lower(s.fullName) like lower(concat('%', :keyword, '%')) or
                   lower(s.email) like lower(concat('%', :keyword, '%')) or
                   lower(s.className) like lower(concat('%', :keyword, '%')) or
                   lower(s.major) like lower(concat('%', :keyword, '%')))
            """)
    Page<Student> search(String keyword, Pageable pageable);
}
