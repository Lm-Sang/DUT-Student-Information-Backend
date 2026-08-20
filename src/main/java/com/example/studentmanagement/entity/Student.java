package com.example.studentmanagement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "students", indexes = {
        @Index(name = "idx_student_code", columnList = "studentCode", unique = true),
        @Index(name = "idx_student_email", columnList = "email", unique = true)
})
public class Student extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String studentCode;

    @Column(nullable = false)
    private String fullName;

    private LocalDate dateOfBirth;

    private String gender;

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    private String address;

    @Column(nullable = false)
    private String className;

    @Column(nullable = false)
    private String major;

    @Column(nullable = false)
    private String academicYear;

    @Column(nullable = false)
    private LocalDate enrollmentDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StudentStatus status = StudentStatus.ACTIVE;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;
}
