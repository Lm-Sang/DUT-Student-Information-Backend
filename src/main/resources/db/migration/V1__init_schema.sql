create table if not exists users (
    id bigserial primary key,
    username varchar(100) not null unique,
    password varchar(255) not null,
    email varchar(255) not null unique,
    role varchar(20) not null,
    enabled boolean not null,
    created_at timestamp not null,
    updated_at timestamp not null
);

create table if not exists students (
    id bigserial primary key,
    student_code varchar(30) not null unique,
    full_name varchar(255) not null,
    date_of_birth date,
    gender varchar(20),
    email varchar(255) not null unique,
    phone varchar(50),
    address varchar(500),
    class_name varchar(100) not null,
    major varchar(100) not null,
    academic_year varchar(30) not null,
    enrollment_date date not null,
    status varchar(20) not null,
    user_id bigint unique,
    created_at timestamp not null,
    updated_at timestamp not null,
    constraint fk_student_user foreign key (user_id) references users(id)
);

create table if not exists courses (
    id bigserial primary key,
    course_code varchar(30) not null unique,
    course_name varchar(255) not null,
    description varchar(2000),
    credits integer not null,
    department varchar(100) not null,
    max_students integer not null,
    current_students integer not null,
    semester varchar(30) not null,
    academic_year varchar(30) not null,
    status varchar(20) not null,
    created_at timestamp not null,
    updated_at timestamp not null
);

create table if not exists enrollments (
    id bigserial primary key,
    student_id bigint not null references students(id),
    course_id bigint not null references courses(id),
    semester varchar(30) not null,
    academic_year varchar(30) not null,
    enrollment_date date not null,
    status varchar(20) not null,
    created_at timestamp not null,
    updated_at timestamp not null,
    constraint uk_enrollment_student_course_term unique (student_id, course_id, semester, academic_year)
);

create table if not exists grades (
    id bigserial primary key,
    student_id bigint not null references students(id),
    course_id bigint not null references courses(id),
    midterm_score double precision not null,
    final_score double precision not null,
    total_score double precision not null,
    letter_grade varchar(5) not null,
    semester varchar(30) not null,
    academic_year varchar(30) not null,
    created_at timestamp not null,
    updated_at timestamp not null
);

create table if not exists schedules (
    id bigserial primary key,
    course_id bigint not null references courses(id),
    classroom varchar(100) not null,
    day_of_week varchar(20) not null,
    start_time time not null,
    end_time time not null,
    lecturer varchar(255) not null,
    semester varchar(30) not null,
    academic_year varchar(30) not null,
    created_at timestamp not null,
    updated_at timestamp not null
);

create table if not exists exams (
    id bigserial primary key,
    course_id bigint not null references courses(id),
    exam_type varchar(50) not null,
    exam_date_time timestamp not null,
    room varchar(50) not null,
    semester varchar(30) not null,
    academic_year varchar(30) not null,
    created_at timestamp not null,
    updated_at timestamp not null
);

create table if not exists tuition (
    id bigserial primary key,
    student_id bigint not null references students(id),
    semester varchar(30) not null,
    academic_year varchar(30) not null,
    total_amount numeric(12,2) not null,
    paid_amount numeric(12,2) not null,
    remaining_amount numeric(12,2) not null,
    due_date date not null,
    status varchar(20) not null,
    created_at timestamp not null,
    updated_at timestamp not null
);

create table if not exists tuition_payments (
    id bigserial primary key,
    tuition_id bigint not null references tuition(id),
    amount numeric(12,2) not null,
    payment_date timestamp not null,
    payment_method varchar(50) not null,
    transaction_code varchar(100) not null unique,
    status varchar(20) not null,
    created_at timestamp not null,
    updated_at timestamp not null
);

create table if not exists notifications (
    id bigserial primary key,
    title varchar(255) not null,
    content varchar(4000) not null,
    type varchar(30) not null,
    published_at timestamp,
    created_by bigint references users(id),
    target_role varchar(20) not null,
    is_read boolean not null,
    created_at timestamp not null,
    updated_at timestamp not null
);

create index if not exists idx_student_code on students(student_code);
create index if not exists idx_student_email on students(email);
create index if not exists idx_course_code on courses(course_code);
create index if not exists idx_user_username on users(username);
