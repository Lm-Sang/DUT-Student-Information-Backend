package com.example.studentmanagement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "exams")
public class Exam extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id")
    private Course course;

    @Column(nullable = false)
    private String examType;

    @Column(nullable = false)
    private LocalDateTime examDateTime;

    @Column(nullable = false)
    private String room;

    @Column(nullable = false)
    private String semester;

    @Column(nullable = false)
    private String academicYear;
}
