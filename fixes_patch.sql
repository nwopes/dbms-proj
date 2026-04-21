-- ============================================================
-- FIXES PATCH — run this AFTER schema.sql AND novelty_patch.sql
-- Fixes:
--   #2  Remove hardcoded officer_id=1 trigger on Crime insert
--   #7  Auto-close Case File when court verdict is finalized
--   #16 Missing audit triggers for Court_Case, Evidence UPDATE/DELETE,
--       Case_File DELETE, FIR UPDATE/DELETE, Crime_Person INSERT/DELETE
-- ============================================================

USE crime_db;

-- ============================================================
-- Issue #2: Remove the trigger that auto-creates Case Files
-- with a hardcoded officer (officer_id=1). Cases are now
-- managed manually through the UI.
-- ============================================================
DROP TRIGGER IF EXISTS after_crime_insert;


-- ============================================================
-- Issue #7: Auto-close Case File when a final court verdict
-- is entered (Guilty / Acquitted / Dismissed).
-- ============================================================

DROP TRIGGER IF EXISTS after_court_verdict_insert;
DELIMITER //
CREATE TRIGGER after_court_verdict_insert
    AFTER INSERT ON Court_Case
    FOR EACH ROW
BEGIN
    IF NEW.verdict IN ('Guilty', 'Acquitted', 'Dismissed') THEN
        UPDATE Case_File
        SET case_status = 'Closed',
            end_date    = COALESCE(NEW.hearing_date, CURDATE())
        WHERE case_id = NEW.case_id
          AND case_status != 'Closed';
    END IF;
END //
DELIMITER ;

DROP TRIGGER IF EXISTS after_court_verdict_update;
DELIMITER //
CREATE TRIGGER after_court_verdict_update
    AFTER UPDATE ON Court_Case
    FOR EACH ROW
BEGIN
    IF NEW.verdict IN ('Guilty', 'Acquitted', 'Dismissed')
       AND OLD.verdict != NEW.verdict THEN
        UPDATE Case_File
        SET case_status = 'Closed',
            end_date    = COALESCE(NEW.hearing_date, CURDATE())
        WHERE case_id = NEW.case_id
          AND case_status != 'Closed';
    END IF;
END //
DELIMITER ;


-- ============================================================
-- Issue #16: Missing Audit Triggers
-- ============================================================

-- Court_Case INSERT
DROP TRIGGER IF EXISTS audit_court_insert;
DELIMITER //
CREATE TRIGGER audit_court_insert
    AFTER INSERT ON Court_Case FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Court_Case', 'INSERT', NEW.court_case_id,
        CONCAT('CaseID:', NEW.case_id,
               ' | Court:', NEW.court_name,
               ' | Verdict:', NEW.verdict,
               ' | Hearing:', NEW.hearing_date));
END //
DELIMITER ;

-- Court_Case UPDATE
DROP TRIGGER IF EXISTS audit_court_update;
DELIMITER //
CREATE TRIGGER audit_court_update
    AFTER UPDATE ON Court_Case FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Court_Case', 'UPDATE', NEW.court_case_id,
        CONCAT('Verdict: ', OLD.verdict, ' → ', NEW.verdict,
               ' | Court: ', NEW.court_name));
END //
DELIMITER ;

-- Court_Case DELETE
DROP TRIGGER IF EXISTS audit_court_delete;
DELIMITER //
CREATE TRIGGER audit_court_delete
    AFTER DELETE ON Court_Case FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Court_Case', 'DELETE', OLD.court_case_id,
        CONCAT('Deleted: Case#', OLD.case_id,
               ' Court:', OLD.court_name,
               ' Verdict:', OLD.verdict));
END //
DELIMITER ;

-- Evidence UPDATE
DROP TRIGGER IF EXISTS audit_evidence_update;
DELIMITER //
CREATE TRIGGER audit_evidence_update
    AFTER UPDATE ON Evidence FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Evidence', 'UPDATE', NEW.evidence_id,
        CONCAT('Type: ', OLD.evidence_type, ' → ', NEW.evidence_type,
               ' | Case#', NEW.case_id));
END //
DELIMITER ;

-- Evidence DELETE
DROP TRIGGER IF EXISTS audit_evidence_delete;
DELIMITER //
CREATE TRIGGER audit_evidence_delete
    AFTER DELETE ON Evidence FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Evidence', 'DELETE', OLD.evidence_id,
        CONCAT('Deleted: ', OLD.evidence_type,
               ' | CaseID:', OLD.case_id));
END //
DELIMITER ;

-- Case_File DELETE
DROP TRIGGER IF EXISTS audit_case_delete;
DELIMITER //
CREATE TRIGGER audit_case_delete
    AFTER DELETE ON Case_File FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Case_File', 'DELETE', OLD.case_id,
        CONCAT('Deleted: CrimeID:', OLD.crime_id,
               ' | Status:', OLD.case_status));
END //
DELIMITER ;

-- FIR UPDATE
DROP TRIGGER IF EXISTS audit_fir_update;
DELIMITER //
CREATE TRIGGER audit_fir_update
    AFTER UPDATE ON FIR FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('FIR', 'UPDATE', NEW.fir_id,
        CONCAT('CrimeID:', NEW.crime_id,
               ' | FiledBy:', NEW.filed_by,
               ' | Date:', NEW.filing_date));
END //
DELIMITER ;

-- FIR DELETE
DROP TRIGGER IF EXISTS audit_fir_delete;
DELIMITER //
CREATE TRIGGER audit_fir_delete
    AFTER DELETE ON FIR FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('FIR', 'DELETE', OLD.fir_id,
        CONCAT('Deleted: CrimeID:', OLD.crime_id,
               ' | Date:', OLD.filing_date));
END //
DELIMITER ;

-- Crime_Person INSERT
DROP TRIGGER IF EXISTS audit_crime_person_insert;
DELIMITER //
CREATE TRIGGER audit_crime_person_insert
    AFTER INSERT ON Crime_Person FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Crime_Person', 'INSERT', NEW.crime_id,
        CONCAT('PersonID:', NEW.person_id, ' | Role:', NEW.role));
END //
DELIMITER ;

-- Crime_Person UPDATE
DROP TRIGGER IF EXISTS audit_crime_person_update;
DELIMITER //
CREATE TRIGGER audit_crime_person_update
    AFTER UPDATE ON Crime_Person FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Crime_Person', 'UPDATE', NEW.crime_id,
        CONCAT('PersonID:', NEW.person_id,
               ' | Role: ', OLD.role, ' → ', NEW.role));
END //
DELIMITER ;

-- Crime_Person DELETE
DROP TRIGGER IF EXISTS audit_crime_person_delete;
DELIMITER //
CREATE TRIGGER audit_crime_person_delete
    AFTER DELETE ON Crime_Person FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Crime_Person', 'DELETE', OLD.crime_id,
        CONCAT('PersonID:', OLD.person_id,
               ' | Role:', OLD.role, ' removed'));
END //
DELIMITER ;
