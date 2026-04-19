-- ============================================================
-- NOVELTY FEATURES PATCH — run this AFTER schema.sql
-- 1. Audit Log Table + Triggers
-- 2. Evidence file_path column
-- ============================================================

USE crime_db;

-- ============================================================
-- AUDIT LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS Audit_Log (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(10) NOT NULL,   -- INSERT / UPDATE / DELETE
    record_id INT,
    changed_by VARCHAR(100) DEFAULT 'system',
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);

-- Audit trigger: Crime INSERT
DROP TRIGGER IF EXISTS audit_crime_insert;
DELIMITER //
CREATE TRIGGER audit_crime_insert
    AFTER INSERT ON Crime FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Crime', 'INSERT', NEW.crime_id,
        CONCAT('Type:', NEW.crime_type, ' | Date:', NEW.date, ' | Status:', NEW.status));
END //
DELIMITER ;

-- Audit trigger: Crime UPDATE
DROP TRIGGER IF EXISTS audit_crime_update;
DELIMITER //
CREATE TRIGGER audit_crime_update
    AFTER UPDATE ON Crime FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Crime', 'UPDATE', NEW.crime_id,
        CONCAT('Status: ', OLD.status, ' → ', NEW.status,
               ' | Type: ', OLD.crime_type, ' → ', NEW.crime_type));
END //
DELIMITER ;

-- Audit trigger: Crime DELETE
DROP TRIGGER IF EXISTS audit_crime_delete;
DELIMITER //
CREATE TRIGGER audit_crime_delete
    AFTER DELETE ON Crime FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Crime', 'DELETE', OLD.crime_id,
        CONCAT('Deleted: ', OLD.crime_type, ' on ', OLD.date));
END //
DELIMITER ;

-- Audit trigger: Case_File INSERT
DROP TRIGGER IF EXISTS audit_case_insert;
DELIMITER //
CREATE TRIGGER audit_case_insert
    AFTER INSERT ON Case_File FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Case_File', 'INSERT', NEW.case_id,
        CONCAT('CrimeID:', NEW.crime_id, ' | Officer:', NEW.lead_officer_id, ' | Status:', NEW.case_status));
END //
DELIMITER ;

-- Audit trigger: Case_File UPDATE
DROP TRIGGER IF EXISTS audit_case_update;
DELIMITER //
CREATE TRIGGER audit_case_update
    AFTER UPDATE ON Case_File FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Case_File', 'UPDATE', NEW.case_id,
        CONCAT('Status: ', OLD.case_status, ' → ', NEW.case_status));
END //
DELIMITER ;

-- Audit trigger: FIR INSERT
DROP TRIGGER IF EXISTS audit_fir_insert;
DELIMITER //
CREATE TRIGGER audit_fir_insert
    AFTER INSERT ON FIR FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('FIR', 'INSERT', NEW.fir_id,
        CONCAT('CrimeID:', NEW.crime_id, ' | FiledBy:', NEW.filed_by, ' | Date:', NEW.filing_date));
END //
DELIMITER ;

-- Audit trigger: Evidence INSERT
DROP TRIGGER IF EXISTS audit_evidence_insert;
DELIMITER //
CREATE TRIGGER audit_evidence_insert
    AFTER INSERT ON Evidence FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Evidence', 'INSERT', NEW.evidence_id,
        CONCAT('Type:', NEW.evidence_type, ' | CaseID:', NEW.case_id));
END //
DELIMITER ;

-- Add file_path column to Evidence for file uploads
ALTER TABLE Evidence ADD COLUMN IF NOT EXISTS file_path VARCHAR(500) DEFAULT NULL;
ALTER TABLE Evidence ADD COLUMN IF NOT EXISTS file_name VARCHAR(255) DEFAULT NULL;
ALTER TABLE Evidence ADD COLUMN IF NOT EXISTS file_type VARCHAR(100) DEFAULT NULL;

-- Seed some audit log entries from existing data
INSERT INTO Audit_Log (table_name, operation, record_id, details, changed_at) VALUES
('Crime', 'INSERT', 1, 'Type:Theft | Date:2024-01-15 | Status:Open', '2024-01-15 14:35:00'),
('Crime', 'INSERT', 2, 'Type:Robbery | Date:2024-02-20 | Status:Open', '2024-02-20 22:05:00'),
('Crime', 'UPDATE', 2, 'Status: Open → Closed | Type: Robbery → Robbery', '2024-03-10 10:00:00'),
('Case_File', 'INSERT', 1, 'CrimeID:1 | Officer:1 | Status:Open', '2024-01-16 09:00:00'),
('Case_File', 'INSERT', 2, 'CrimeID:2 | Officer:2 | Status:Open', '2024-02-21 08:30:00'),
('Case_File', 'UPDATE', 2, 'Status: Open → Closed', '2024-03-10 10:05:00'),
('FIR', 'INSERT', 1, 'CrimeID:1 | FiledBy:1 | Date:2024-01-15', '2024-01-15 15:00:00'),
('FIR', 'INSERT', 2, 'CrimeID:2 | FiledBy:2 | Date:2024-02-20', '2024-02-20 22:30:00'),
('Evidence', 'INSERT', 1, 'Type:CCTV Footage | CaseID:1', '2024-01-16 11:00:00'),
('Evidence', 'INSERT', 2, 'Type:Weapon | CaseID:2', '2024-02-21 09:00:00'),
('Crime', 'INSERT', 3, 'Type:Assault | Date:2024-03-05 | Status:Under Investigation', '2024-03-05 18:50:00'),
('Crime', 'INSERT', 4, 'Type:Fraud | Date:2024-04-10 | Status:Under Investigation', '2024-04-10 09:10:00'),
('Case_File', 'INSERT', 3, 'CrimeID:3 | Officer:1 | Status:Under Investigation', '2024-03-06 08:00:00'),
('Crime', 'DELETE', 16, 'Deleted: Test on 2024-01-01', '2024-04-15 14:00:00'),
('FIR', 'INSERT', 5, 'CrimeID:5 | FiledBy:9 | Date:2024-05-12', '2024-05-12 07:00:00');
