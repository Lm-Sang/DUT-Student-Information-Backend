package com.example.studentmanagement.service;

import com.example.studentmanagement.dto.student.StudentRequest;
import com.example.studentmanagement.entity.Student;
import com.example.studentmanagement.exception.ResourceNotFoundException;
import com.example.studentmanagement.repository.StudentRepository;
import com.example.studentmanagement.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class StudentService {
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    public StudentService(StudentRepository studentRepository, UserRepository userRepository) {
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
    }

    public Student getMe(Student currentStudent) {
        return studentRepository.findById(currentStudent.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
    }

    public Student getById(Long id) {
        return studentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Student not found"));
    }

    public Page<Student> getAll(String keyword, Pageable pageable) {
        return studentRepository.search((keyword == null || keyword.isBlank()) ? null : keyword, pageable);
    }

    public Student create(StudentRequest req) {
        Student s = new Student();
        apply(req, s);
        if (req.userId() != null) {
            s.setUser(userRepository.findById(req.userId()).orElseThrow(() -> new ResourceNotFoundException("User not found")));
        }
        return studentRepository.save(s);
    }

    public Student update(Long id, StudentRequest req) {
        Student s = getById(id);
        apply(req, s);
        if (req.userId() != null) {
            s.setUser(userRepository.findById(req.userId()).orElseThrow(() -> new ResourceNotFoundException("User not found")));
        }
        return studentRepository.save(s);
    }

    public void delete(Long id) {
        studentRepository.delete(getById(id));
    }

    private void apply(StudentRequest req, Student s) {
        s.setStudentCode(req.studentCode());
        s.setFullName(req.fullName());
        s.setDateOfBirth(req.dateOfBirth());
        s.setGender(req.gender());
        s.setEmail(req.email());
        s.setPhone(req.phone());
        s.setAddress(req.address());
        s.setClassName(req.className());
        s.setMajor(req.major());
        s.setAcademicYear(req.academicYear());
        s.setEnrollmentDate(req.enrollmentDate());
        s.setStatus(req.status());
    }
}
