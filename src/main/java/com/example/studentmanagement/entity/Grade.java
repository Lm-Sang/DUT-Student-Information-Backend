package com.example.studentmanagement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "grades")
public class Grade extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id")
    private Course course;

    @Column(nullable = false)
    private Double midtermScore;

    @Column(nullable = false)
    private Double finalScore;

    @Column(nullable = false)
    private Double totalScore;

    @Column(nullable = false)
    private String letterGrade;

    @Column(nullable = false)
    private String semester;

    @Column(nullable = false)
    private String academicYear;
}
