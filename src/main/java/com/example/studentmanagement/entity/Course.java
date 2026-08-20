package com.example.studentmanagement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "courses", indexes = {
        @Index(name = "idx_course_code", columnList = "courseCode", unique = true)
})
public class Course extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String courseCode;

    @Column(nullable = false)
    private String courseName;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private Integer credits;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private Integer maxStudents;

    @Column(nullable = false)
    private Integer currentStudents = 0;

    @Column(nullable = false)
    private String semester;

    @Column(nullable = false)
    private String academicYear;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CourseStatus status = CourseStatus.OPEN;
}
