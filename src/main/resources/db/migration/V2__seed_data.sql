insert into users (username, password, email, role, enabled, created_at, updated_at)
values
  ('admin', '$2b$12$KeEWltxbA2IZc539HkfSuuohkm1hkpX/lqciCOtZJ2wt.073H2nFa', 'admin@university.edu', 'ADMIN', true, now(), now()),
  ('staff', '$2b$12$zYlYRG4cq1XzSm3RzwrvOOVodPI.dTPU.OjiZ3ipwB2HzIv3nD.oK', 'staff@university.edu', 'STAFF', true, now(), now()),
  ('student', '$2b$12$fpq8fBjXrTDfZZDjLpN4veyDZ0e0aWETG6Ca.WRvUD6izZWBDCTra', 'student@university.edu', 'STUDENT', true, now(), now())
on conflict (username) do nothing;

insert into students (student_code, full_name, email, class_name, major, academic_year, enrollment_date, status, user_id, created_at, updated_at)
select 'SE0001', 'Demo Student', 'student.profile@university.edu', 'SE-01', 'Software Engineering', '2026', current_date, 'ACTIVE', id, now(), now()
from users where username = 'student'
on conflict (student_code) do nothing;

insert into courses (course_code, course_name, description, credits, department, max_students, current_students, semester, academic_year, status, created_at, updated_at)
values
  ('SE101', 'Introduction to Programming', 'Core programming foundations', 3, 'Software Engineering', 60, 0, 'Fall', '2026', 'OPEN', now(), now()),
  ('SE201', 'Database Systems', 'Relational database concepts', 3, 'Software Engineering', 50, 0, 'Fall', '2026', 'OPEN', now(), now())
on conflict (course_code) do nothing;
