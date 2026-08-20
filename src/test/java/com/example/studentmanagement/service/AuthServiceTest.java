package com.example.studentmanagement.service;

import com.example.studentmanagement.dto.auth.LoginRequest;
import com.example.studentmanagement.entity.Role;
import com.example.studentmanagement.entity.User;
import com.example.studentmanagement.repository.UserRepository;
import com.example.studentmanagement.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthServiceTest {
    private AuthenticationManager authenticationManager;
    private JwtService jwtService;
    private UserRepository userRepository;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        authenticationManager = mock(AuthenticationManager.class);
        jwtService = mock(JwtService.class);
        userRepository = mock(UserRepository.class);
        CurrentUserService currentUserService = mock(CurrentUserService.class);
        authService = new AuthService(authenticationManager, jwtService, currentUserService, userRepository);
    }

    @Test
    void loginShouldReturnJwtResponse() {
        User user = new User();
        user.setUsername("student");
        user.setRole(Role.STUDENT);

        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(userRepository.findByUsername("student")).thenReturn(Optional.of(user));
        when(jwtService.generateToken("student", Role.STUDENT)).thenReturn("jwt-token");

        var response = authService.login(new LoginRequest("student", "student123"));

        assertThat(response.accessToken()).isEqualTo("jwt-token");
        assertThat(response.role()).isEqualTo(Role.STUDENT);
    }
}
