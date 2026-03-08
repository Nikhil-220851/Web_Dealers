-- USERS TABLE
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(15),
    password_hash TEXT NOT NULL,
    role ENUM('admin','borrower') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- index for login
CREATE INDEX idx_users_email ON users(email);

-- ADMINS TABLE
CREATE TABLE admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    bank_name VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- BORROWERS TABLE
CREATE TABLE borrowers (
    borrower_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    annual_income DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- KYC DETAILS
CREATE TABLE kyc_details (
    kyc_id INT AUTO_INCREMENT PRIMARY KEY,
    borrower_id INT,
    aadhaar_number VARCHAR(20),
    pan_number VARCHAR(15),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (borrower_id) REFERENCES borrowers(borrower_id) ON DELETE CASCADE
);

-- BANK DETAILS
CREATE TABLE bank_details (
    bank_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    borrower_id INT,
    bank_name VARCHAR(100),
    account_number VARCHAR(30),
    ifsc_code VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (borrower_id) REFERENCES borrowers(borrower_id)
);

-- LOAN TYPES
CREATE TABLE loan_types (
    loan_type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    description TEXT
);

-- LOAN PROVIDERS
CREATE TABLE loan_providers (
    provider_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150),
    type VARCHAR(50)
);

-- LOAN APPLICATIONS
CREATE TABLE loan_applications (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    borrower_id INT,
    loan_type_id INT,
    provider_id INT,
    amount DECIMAL(12,2),
    interest_rate DECIMAL(5,2),
    tenure INT,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (borrower_id) REFERENCES borrowers(borrower_id),
    FOREIGN KEY (loan_type_id) REFERENCES loan_types(loan_type_id),
    FOREIGN KEY (provider_id) REFERENCES loan_providers(provider_id)
);

CREATE INDEX idx_application_status ON loan_applications(status);

-- LOANS TABLE
CREATE TABLE loans (
    loan_id INT AUTO_INCREMENT PRIMARY KEY,
    borrower_id INT,
    application_id INT,
    amount DECIMAL(12,2),
    interest_rate DECIMAL(5,2),
    tenure_months INT,
    status ENUM('active','completed','default') DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (borrower_id) REFERENCES borrowers(borrower_id),
    FOREIGN KEY (application_id) REFERENCES loan_applications(application_id)
);

CREATE INDEX idx_loan_status ON loans(status);

-- EMI SCHEDULE
CREATE TABLE emi_schedule (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT,
    installment_number INT,
    due_date DATE,
    principal_amount DECIMAL(10,2),
    interest_amount DECIMAL(10,2),
    total_emi DECIMAL(10,2),
    status ENUM('pending','paid','late') DEFAULT 'pending',
    FOREIGN KEY (loan_id) REFERENCES loans(loan_id)
);

-- PAYMENTS TABLE
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT,
    borrower_id INT,
    amount DECIMAL(10,2),
    payment_date TIMESTAMP,
    payment_status VARCHAR(20),
    transaction_id VARCHAR(100),
    FOREIGN KEY (loan_id) REFERENCES loans(loan_id),
    FOREIGN KEY (borrower_id) REFERENCES borrowers(borrower_id)
);

-- USER SETTINGS
CREATE TABLE user_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    language VARCHAR(20) DEFAULT 'English',
    theme VARCHAR(20) DEFAULT 'light',
    notifications BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- LOAN RECOMMENDATIONS
CREATE TABLE loan_recommendations (
    recommendation_id INT AUTO_INCREMENT PRIMARY KEY,
    borrower_id INT,
    loan_type_id INT,
    recommended_amount DECIMAL(12,2),
    interest_rate DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (borrower_id) REFERENCES borrowers(borrower_id)
);

-- EXAMPLE DATA
INSERT INTO loan_types (name,description) VALUES
('Home Loan','Loan for buying house'),
('Car Loan','Loan for vehicle purchase'),
('Education Loan','Loan for education'),
('Personal Loan','General loan');

INSERT INTO loan_providers (name,type) VALUES
('HDFC Bank','bank'),
('SBI','bank'),
('Bajaj Finance','nbfc');

-- LOGIN QUERY
SELECT id,password_hash,role
FROM users
WHERE email='user@email.com';

-- REGISTER USER
INSERT INTO users(name,email,phone,password_hash,role)
VALUES('John Doe','john@email.com','9876543210','HASHED_PASSWORD','borrower');

-- CREATE BORROWER PROFILE
INSERT INTO borrowers(user_id,annual_income)
VALUES(1,600000);

-- ADD KYC DETAILS
INSERT INTO kyc_details(borrower_id,aadhaar_number,pan_number)
VALUES(1,'AADHAAR_ENCRYPTED','PAN_ENCRYPTED');

-- APPLY FOR LOAN
INSERT INTO loan_applications
(borrower_id,loan_type_id,provider_id,amount,interest_rate,tenure)
VALUES
(1,1,1,500000,8.5,60);

-- ADMIN APPROVE LOAN
UPDATE loan_applications
SET status='approved'
WHERE application_id=1;

-- CREATE LOAN AFTER APPROVAL
INSERT INTO loans
(borrower_id,application_id,amount,interest_rate,tenure_months,start_date)
VALUES
(1,1,500000,8.5,60,CURDATE());

-- BORROWER DASHBOARD QUERY
SELECT *
FROM loans
WHERE borrower_id=1
AND status='active';

-- PAYMENT HISTORY
SELECT *
FROM payments
WHERE borrower_id=1
ORDER BY payment_date DESC;

-- MY LOANS PAGE
SELECT *
FROM loan_applications
WHERE borrower_id=1
AND status='pending';

SELECT *
FROM loan_applications
WHERE borrower_id=1
AND status='approved';

SELECT *
FROM loan_applications
WHERE borrower_id=1
AND status='rejected';

-- ADMIN DASHBOARD
SELECT COUNT(*) FROM users WHERE role='borrower';

SELECT COUNT(*) FROM loans;

SELECT SUM(amount) FROM loans;

SELECT DATE(created_at),COUNT(*)
FROM loan_applications
WHERE status='approved'
GROUP BY DATE(created_at);

-- EMI PAYMENTS HISTORY
SELECT *
FROM emi_schedule
WHERE loan_id=1
ORDER BY installment_number;