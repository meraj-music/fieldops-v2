-- #############################################################################
-- # 1. Custom Data Types (Enums)
-- #############################################################################

CREATE TYPE user_role AS ENUM ('Admin', 'CSmanager', 'CSmember', 'MKTmanager', 'MKTmember');
CREATE TYPE department_type AS ENUM ('CS', 'Marketing', 'Admin');
CREATE TYPE board_type AS ENUM ('Team', 'Goals', 'Personal');
CREATE TYPE kanban_status AS ENUM ('Ideation', 'In Progress', 'Done', 'Cancelled');

-- #############################################################################
-- # 2. Tables
-- #############################################################################

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    department department_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initiatives Table
CREATE TABLE initiatives (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT, 
    status kanban_status DEFAULT 'Ideation',
    department department_type NOT NULL,
    board_type board_type NOT NULL DEFAULT 'Team',
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL, 
    due_date DATE,
    last_update TEXT,
    next_action TEXT,
    
    -- RACI Matrix Integration
    raci_supervising_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    raci_responsible_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    raci_consulted_informed TEXT[], 
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initiative Resources (Hyperlinks/Attachments)
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    initiative_id INTEGER REFERENCES initiatives(id) ON DELETE CASCADE,
    title VARCHAR(255),
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments 
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    initiative_id INTEGER REFERENCES initiatives(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Marketing Campaign Metrics
CREATE TABLE campaign_metrics (
    id SERIAL PRIMARY KEY,
    campaign_name VARCHAR(255) NOT NULL,
    description TEXT,
    avg_open_rate NUMERIC(5,2) DEFAULT 0.00,
    click_through_rate NUMERIC(5,2) DEFAULT 0.00,
    lms_course_completions INTEGER DEFAULT 0,
    dynamic_metric_title VARCHAR(255), 
    dynamic_metric_value INTEGER DEFAULT 0,
    logged_date DATE DEFAULT CURRENT_DATE
);

-- #############################################################################
-- # 3. Seed Data (Users, Initiatives, Metrics)
-- #############################################################################

-- The password_hash below is the valid bcrypt hash for '12345678'
INSERT INTO users (username, email, password_hash, role, department) VALUES
('central.admin',  'admin@fieldops.com',  '$2a$10$iel3v9SMEfZ9zVZgEQGHz.lmz2j19kCleLbzt3XV8iJqLB5EBa/v.', 'Admin',      'Admin'),
('cs.memberone',   'csm1@fieldops.com',   '$2a$10$iel3v9SMEfZ9zVZgEQGHz.lmz2j19kCleLbzt3XV8iJqLB5EBa/v.', 'CSmember',   'CS'),
('cs.membertwo',   'csm2@fieldops.com',   '$2a$10$iel3v9SMEfZ9zVZgEQGHz.lmz2j19kCleLbzt3XV8iJqLB5EBa/v.', 'CSmember',   'CS'),
('cs.managerone',  'cs.mgr1@fieldops.com','$2a$10$iel3v9SMEfZ9zVZgEQGHz.lmz2j19kCleLbzt3XV8iJqLB5EBa/v.', 'CSmanager',  'CS'),
('cs.managertwo',  'cs.mgr2@fieldops.com','$2a$10$iel3v9SMEfZ9zVZgEQGHz.lmz2j19kCleLbzt3XV8iJqLB5EBa/v.', 'CSmanager',  'CS'),
('mkt.memberone',  'mkt1@fieldops.com',   '$2a$10$iel3v9SMEfZ9zVZgEQGHz.lmz2j19kCleLbzt3XV8iJqLB5EBa/v.', 'MKTmember',  'Marketing'),
('mkt.membertwo',  'mkt2@fieldops.com',   '$2a$10$iel3v9SMEfZ9zVZgEQGHz.lmz2j19kCleLbzt3XV8iJqLB5EBa/v.', 'MKTmember',  'Marketing'),
('mkt.managerone', 'mkt.mgr1@fieldops.com','$2a$10$iel3v9SMEfZ9zVZgEQGHz.lmz2j19kCleLbzt3XV8iJqLB5EBa/v.', 'MKTmanager', 'Marketing'),
('mkt.managertwo', 'mkt.mgr2@fieldops.com','$2a$10$iel3v9SMEfZ9zVZgEQGHz.lmz2j19kCleLbzt3XV8iJqLB5EBa/v.', 'MKTmanager', 'Marketing');

-- Seed Initiatives showcasing different board types, ownership, and RACI
INSERT INTO initiatives (title, description, status, department, board_type, owner_id, due_date, last_update, next_action, raci_supervising_id, raci_responsible_id, raci_consulted_informed) VALUES
('Q3 Enterprise Onboarding', 'Streamline onboarding process for enterprise accounts.', 'In Progress', 'CS', 'Team', 4, '2026-06-30', 'Drafted new email templates.', 'Review with Marketing.', 4, 2, ARRAY['mkt.managerone', 'cs.membertwo']),
('Reduce Churn Rate by 5%', 'Personal Q3 goal.', 'Ideation', 'CS', 'Goals', 2, '2026-08-15', 'Gathering historical data.', 'Run analysis script.', 4, 2, ARRAY[]::TEXT[]),
('Spring Cleaning Campaign', 'Focus on account hygiene and flightboard cleanups.', 'Done', 'Marketing', 'Team', 8, '2026-04-30', 'Final emails sent.', 'Analyze Gemini report.', 8, 6, ARRAY['CS Team']);

-- Seed Campaign Metrics (matching your screenshot)
INSERT INTO campaign_metrics (campaign_name, description, avg_open_rate, click_through_rate, lms_course_completions, dynamic_metric_title, dynamic_metric_value) VALUES
('Spring Cleaning: Relief, Clarity, and Actionable Steps', 'Focus on account hygiene and efficiency.', 23.67, 3.53, 55, 'Flightboard Cleanups', 145);