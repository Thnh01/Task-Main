CREATE DATABASE IF NOT EXISTS TaskManagerDB_testing;
USE TaskManagerDB_testing;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('GROUP_LEADER', 'MEMBER') DEFAULT 'MEMBER',
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    avatar_color VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Categories table
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tasks table
CREATE TABLE tasks (
    task_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status ENUM('PENDING', 'TO_DO', 'IN_PROGRESS', 'DONE') DEFAULT 'PENDING',
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
    start_date DATE,
    due_date DATE NOT NULL,
    category_id INT,
    created_by INT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_due_date (due_date),
    INDEX idx_is_deleted (is_deleted),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Task assignments table (many-to-many)
CREATE TABLE task_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (task_id, user_id),
    INDEX idx_task_id (task_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tags table
CREATE TABLE tags (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Task tags table (many-to-many)
CREATE TABLE task_tags (
    task_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (task_id, tag_id),
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Task attachments table
CREATE TABLE task_attachments (
    attachment_id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id),
    INDEX idx_task_id (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Activity log table
CREATE TABLE activity_log (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    action_type ENUM('CREATED', 'UPDATED', 'STATUS_CHANGED', 'ASSIGNED', 
                     'DELETED', 'RESTORED', 'FILE_UPLOADED', 'FILE_REMOVED') NOT NULL,
    old_value VARCHAR(255),
    new_value VARCHAR(255),
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_task_id (task_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert demo data for testing
-- Insert demo users
INSERT INTO users (username, email, password_hash, full_name, role, avatar_color) VALUES
('leader_a', 'leader.a@example.com', '$2a$10$xn3LI/AjqicFYZFruSwve.681477XaVNaUQbr1gioaWPn4t1KsnmG', 'Nguyễn Văn A', 'GROUP_LEADER', '#5B8DEF'),
('member_b', 'member.b@example.com', '$2a$10$xn3LI/AjqicFYZFruSwve.681477XaVNaUQbr1gioaWPn4t1KsnmG', 'Trần Thị B', 'MEMBER', '#5ECFB1'),
('member_c', 'member.c@example.com', '$2a$10$xn3LI/AjqicFYZFruSwve.681477XaVNaUQbr1gioaWPn4t1KsnmG', 'Lê Văn C', 'MEMBER', '#F5A864'),
('leader_d', 'leader.d@example.com', '$2a$10$xn3LI/AjqicFYZFruSwve.681477XaVNaUQbr1gioaWPn4t1KsnmG', 'Phạm Thị D', 'GROUP_LEADER', '#F56565');

-- Insert categories
INSERT INTO categories (name, color) VALUES
('Development', '#3182CE'),
('Design', '#9F7AEA'),
('Testing', '#48BB78'),
('Documentation', '#ED8936');

-- Insert tags
INSERT INTO tags (name, color) VALUES
('urgent', '#F56565'),
('frontend', '#4299E1'),
('backend', '#48BB78'),
('database', '#9F7AEA'),
('design', '#ED8936'),
('documentation', '#38B2AC'),
('analysis', '#DD6B20'),
('authentication', '#667EEA');

-- Insert demo tasks
INSERT INTO tasks (title, description, status, priority, start_date, due_date, category_id, created_by) VALUES
('Phân tích yêu cầu hệ thống', 'Thu thập và phân tích chi tiết yêu cầu người dùng cho dự án mới.', 'DONE', 'HIGH', '2025-11-10', '2025-11-15', 1, 1),
('Thiết kế cơ sở dữ liệu', 'Xây dựng mô hình ERD và tạo script database.', 'IN_PROGRESS', 'URGENT', '2025-11-15', '2025-11-20', 1, 1),
('Phát triển module đăng nhập', 'Xây dựng giao diện và logic xử lý đăng nhập/đăng ký.', 'TO_DO', 'HIGH', '2025-11-20', '2025-11-25', 1, 2);

-- Assign tasks to users
INSERT INTO task_assignments (task_id, user_id) VALUES
(1, 1),
(2, 2),
(2, 3),
(3, 2);

-- Add tags to tasks
INSERT INTO task_tags (task_id, tag_id) VALUES
(1, 6), -- documentation
(1, 7), -- analysis
(2, 3), -- database
(2, 5), -- design
(2, 1), -- urgent
(3, 1), -- urgent
(3, 2), -- frontend
(3, 3), -- backend
(3, 8); -- authentication

-- Create view for task statistics
CREATE VIEW task_statistics AS
SELECT 
    (SELECT COUNT(*) FROM tasks WHERE status = 'TO_DO' AND is_deleted = FALSE) as tasks_todo,
    (SELECT COUNT(*) FROM tasks WHERE status = 'IN_PROGRESS' AND is_deleted = FALSE) as tasks_in_progress,
    (SELECT COUNT(*) FROM tasks WHERE status = 'DONE' AND is_deleted = FALSE) as tasks_done,
    (SELECT COUNT(*) FROM tasks WHERE due_date < CURDATE() AND status != 'DONE' AND is_deleted = FALSE) as tasks_overdue,
    (SELECT COUNT(*) FROM tasks WHERE due_date = CURDATE() AND status != 'DONE' AND is_deleted = FALSE) as tasks_due_today;