package com.example.studentmanagement.repository;

import com.example.studentmanagement.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CourseRepository extends JpaRepository<Course, Long> {
    @Query("""
            select c from Course c
            where (:keyword is null or lower(c.courseCode) like lower(concat('%', :keyword, '%'))
                   or lower(c.courseName) like lower(concat('%', :keyword, '%')))
            and (:semester is null or c.semester = :semester)
            and (:department is null or c.department = :department)
            and (:academicYear is null or c.academicYear = :academicYear)
            """)
    Page<Course> search(String keyword, String semester, String department, String academicYear, Pageable pageable);
}
