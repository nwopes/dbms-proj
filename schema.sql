-- ============================================================
-- CRIME MANAGEMENT SYSTEM — COMPLETE SQL SCRIPT
-- CSD317 Introduction to Database Systems
-- ============================================================

CREATE DATABASE IF NOT EXISTS crime_db;
USE crime_db;

-- ============================================================
-- DDL — TABLE CREATION
-- ============================================================

CREATE TABLE Location (
    location_id INT PRIMARY KEY AUTO_INCREMENT,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10)
);

CREATE TABLE Person (
    person_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    age INT,
    gender VARCHAR(10),
    phone_number VARCHAR(15),
    address VARCHAR(255)
);

CREATE TABLE Police_Station (
    station_id INT PRIMARY KEY AUTO_INCREMENT,
    station_name VARCHAR(100) NOT NULL,
    location_id INT,
    jurisdiction_area VARCHAR(255),
    FOREIGN KEY (location_id) REFERENCES Location(location_id)
);

CREATE TABLE Police_Officer (
    officer_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    designation VARCHAR(50),
    badge_number VARCHAR(50) UNIQUE NOT NULL,
    phone_number VARCHAR(15),
    station_id INT,
    FOREIGN KEY (station_id) REFERENCES Police_Station(station_id)
);

CREATE TABLE Crime (
    crime_id INT PRIMARY KEY AUTO_INCREMENT,
    crime_type VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    time TIME,
    location_id INT,
    description TEXT,
    status VARCHAR(50),
    FOREIGN KEY (location_id) REFERENCES Location(location_id)
);

CREATE TABLE Case_File (
    case_id INT PRIMARY KEY AUTO_INCREMENT,
    crime_id INT,
    lead_officer_id INT,
    case_status VARCHAR(50),
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (crime_id) REFERENCES Crime(crime_id),
    FOREIGN KEY (lead_officer_id) REFERENCES Police_Officer(officer_id)
);

CREATE TABLE Court_Case (
    court_case_id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT,
    court_name VARCHAR(100),
    verdict VARCHAR(50),
    hearing_date DATE,
    FOREIGN KEY (case_id) REFERENCES Case_File(case_id)
);

CREATE TABLE FIR (
    fir_id INT PRIMARY KEY AUTO_INCREMENT,
    crime_id INT,
    filed_by INT,
    filing_date DATE NOT NULL,
    description TEXT,
    FOREIGN KEY (crime_id) REFERENCES Crime(crime_id),
    FOREIGN KEY (filed_by) REFERENCES Person(person_id)
);

CREATE TABLE Evidence (
    evidence_id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT,
    evidence_type VARCHAR(100),
    description TEXT,
    collected_date DATE,
    FOREIGN KEY (case_id) REFERENCES Case_File(case_id)
);

CREATE TABLE Case_Officer (
    case_id INT,
    officer_id INT,
    PRIMARY KEY (case_id, officer_id),
    FOREIGN KEY (case_id) REFERENCES Case_File(case_id),
    FOREIGN KEY (officer_id) REFERENCES Police_Officer(officer_id)
);

CREATE TABLE Crime_Person (
    crime_id INT,
    person_id INT,
    role VARCHAR(20),
    PRIMARY KEY (crime_id, person_id),
    FOREIGN KEY (crime_id) REFERENCES Crime(crime_id),
    FOREIGN KEY (person_id) REFERENCES Person(person_id)
);

-- ============================================================
-- DML — SAMPLE DATA
-- ============================================================

INSERT INTO Location VALUES (1,'123 MG Road','Delhi','Delhi','110001');
INSERT INTO Location VALUES (2,'45 Park Street','Mumbai','Maharashtra','400001');
INSERT INTO Location VALUES (3,'7 Lake View','Bangalore','Karnataka','560001');
INSERT INTO Location VALUES (4,'22 Anna Salai','Chennai','Tamil Nadu','600002');
INSERT INTO Location VALUES (5,'11 Sector 17','Chandigarh','Punjab','160017');
INSERT INTO Location VALUES (6,'88 Civil Lines','Allahabad','UP','211001');
INSERT INTO Location VALUES (7,'5 Jubilee Hills','Hyderabad','Telangana','500033');
INSERT INTO Location VALUES (8,'33 Salt Lake','Kolkata','West Bengal','700064');
INSERT INTO Location VALUES (9,'14 Connaught Place','Delhi','Delhi','110001');
INSERT INTO Location VALUES (10,'66 Koregaon Park','Pune','Maharashtra','411001');

INSERT INTO Person VALUES (1,'Rahul Sharma',32,'Male','9876543210','12 Main St, Delhi');
INSERT INTO Person VALUES (2,'Priya Mehta',27,'Female','9812345678','34 Oak Ave, Mumbai');
INSERT INTO Person VALUES (3,'Amit Kumar',45,'Male','9988776655','5 Hill Rd, Bangalore');
INSERT INTO Person VALUES (4,'Neha Kapoor',28,'Female','9911223344','Sector 62, Noida');
INSERT INTO Person VALUES (5,'Suresh Iyer',52,'Male','9900112233','Anna Nagar, Chennai');
INSERT INTO Person VALUES (6,'Kavya Reddy',23,'Female','9871234567','Banjara Hills, Hyderabad');
INSERT INTO Person VALUES (7,'Vikram Singh',38,'Male','9845671234','Salt Lake, Kolkata');
INSERT INTO Person VALUES (8,'Ananya Das',30,'Female','9765432100','Park Street, Kolkata');
INSERT INTO Person VALUES (9,'Rohit Verma',41,'Male','9654321000','Civil Lines, Allahabad');
INSERT INTO Person VALUES (10,'Deepa Nair',35,'Female','9543210987','Jubilee Hills, Hyderabad');
INSERT INTO Person VALUES (11,'Arjun Patel',29,'Male','9432109876','CG Road, Ahmedabad');
INSERT INTO Person VALUES (12,'Meena Joshi',44,'Female','9321098765','Connaught Place, Delhi');

INSERT INTO Police_Station VALUES (1,'Delhi Central Station',1,'Central Delhi');
INSERT INTO Police_Station VALUES (2,'Mumbai South Station',2,'South Mumbai');
INSERT INTO Police_Station VALUES (3,'Bangalore East Station',3,'East Bangalore');
INSERT INTO Police_Station VALUES (4,'Chennai Central Station',4,'Central Chennai');
INSERT INTO Police_Station VALUES (5,'Chandigarh Sector 17 Station',5,'Sector 17');
INSERT INTO Police_Station VALUES (6,'Allahabad Civil Lines Station',6,'Civil Lines');
INSERT INTO Police_Station VALUES (7,'Hyderabad Jubilee Station',7,'Jubilee Hills');
INSERT INTO Police_Station VALUES (8,'Kolkata Park Street Station',8,'Park Street');

INSERT INTO Police_Officer VALUES (1,'Inspector Raj','Inspector','B1001','9900112233',1);
INSERT INTO Police_Officer VALUES (2,'SI Preethi','Sub-Inspector','B1002','9900112244',2);
INSERT INTO Police_Officer VALUES (3,'Inspector Mehra','Inspector','B1003','9900112255',3);
INSERT INTO Police_Officer VALUES (4,'SI Jayaram','Sub-Inspector','B1004','9900112266',4);
INSERT INTO Police_Officer VALUES (5,'ASP Khanna','ASP','B1005','9900112277',5);
INSERT INTO Police_Officer VALUES (6,'SI Fernandez','Sub-Inspector','B1006','9900112288',6);
INSERT INTO Police_Officer VALUES (7,'Inspector Bose','Inspector','B1007','9900112299',7);
INSERT INTO Police_Officer VALUES (8,'SI Yadav','Sub-Inspector','B1008','9900112300',8);
INSERT INTO Police_Officer VALUES (9,'Inspector Pillai','Inspector','B1009','9900112311',7);
INSERT INTO Police_Officer VALUES (10,'HC Sharma','Head Constable','B1010','9900112322',1);

INSERT INTO Crime VALUES (1,'Theft','2024-01-15','14:30:00',1,'Laptop stolen from office','Open');
INSERT INTO Crime VALUES (2,'Robbery','2024-02-20','22:00:00',2,'ATM robbery at night','Closed');
INSERT INTO Crime VALUES (3,'Assault','2024-03-05','18:45:00',3,'Street assault near market','Under Investigation');
INSERT INTO Crime VALUES (4,'Fraud','2024-04-10','09:00:00',4,'Bank fraud reported','Under Investigation');
INSERT INTO Crime VALUES (5,'Murder','2024-05-12','02:30:00',5,'Body found in park','Open');
INSERT INTO Crime VALUES (6,'Kidnapping','2024-06-01','15:00:00',6,'Child kidnapping','Closed');
INSERT INTO Crime VALUES (7,'Cybercrime','2024-06-20','11:00:00',7,'Online phishing attack','Open');
INSERT INTO Crime VALUES (8,'Theft','2024-07-08','13:00:00',8,'Car theft from parking','Open');
INSERT INTO Crime VALUES (9,'Assault','2024-07-22','20:00:00',9,'Bar fight assault','Closed');
INSERT INTO Crime VALUES (10,'Robbery','2024-08-14','21:30:00',10,'Jewellery store robbery','Under Investigation');
INSERT INTO Crime VALUES (11,'Fraud','2024-09-01','10:00:00',1,'Insurance fraud','Open');
INSERT INTO Crime VALUES (12,'Theft','2024-09-15','16:00:00',2,'Mobile phone snatching','Closed');
INSERT INTO Crime VALUES (13,'Murder','2024-10-02','03:00:00',3,'Domestic violence murder','Under Investigation');
INSERT INTO Crime VALUES (14,'Cybercrime','2024-10-18','09:30:00',4,'Data breach at company','Open');
INSERT INTO Crime VALUES (15,'Kidnapping','2024-11-05','17:00:00',5,'Adult kidnapping for ransom','Closed');

INSERT INTO Case_File VALUES (1,1,1,'Open','2024-01-16',NULL);
INSERT INTO Case_File VALUES (2,2,2,'Closed','2024-02-21','2024-03-10');
INSERT INTO Case_File VALUES (3,3,1,'Under Investigation','2024-03-06',NULL);
INSERT INTO Case_File VALUES (4,4,3,'Under Investigation','2024-04-11',NULL);
INSERT INTO Case_File VALUES (5,5,5,'Open','2024-05-13',NULL);
INSERT INTO Case_File VALUES (6,6,6,'Closed','2024-06-02','2024-07-15');
INSERT INTO Case_File VALUES (7,7,7,'Open','2024-06-21',NULL);
INSERT INTO Case_File VALUES (8,8,8,'Open','2024-07-09',NULL);
INSERT INTO Case_File VALUES (9,9,2,'Closed','2024-07-23','2024-08-05');
INSERT INTO Case_File VALUES (10,10,4,'Under Investigation','2024-08-15',NULL);
INSERT INTO Case_File VALUES (11,11,1,'Open','2024-09-02',NULL);
INSERT INTO Case_File VALUES (12,12,2,'Closed','2024-09-16','2024-10-01');
INSERT INTO Case_File VALUES (13,13,3,'Under Investigation','2024-10-03',NULL);
INSERT INTO Case_File VALUES (14,14,7,'Open','2024-10-19',NULL);
INSERT INTO Case_File VALUES (15,15,5,'Closed','2024-11-06','2024-12-01');

INSERT INTO FIR VALUES (1,1,1,'2024-01-15','Laptop stolen from office premises at 2:30 PM');
INSERT INTO FIR VALUES (2,2,2,'2024-02-20','ATM robbery witnessed near Park Street');
INSERT INTO FIR VALUES (3,3,3,'2024-03-05','Street assault near the market area');
INSERT INTO FIR VALUES (4,4,5,'2024-04-10','Bank fraud reported by account holder');
INSERT INTO FIR VALUES (5,5,9,'2024-05-12','Body discovered in Sector 17 park by morning walker');
INSERT INTO FIR VALUES (6,6,12,'2024-06-01','Child reported missing by parents');
INSERT INTO FIR VALUES (7,7,6,'2024-06-20','Phishing email received, bank account compromised');
INSERT INTO FIR VALUES (8,8,7,'2024-07-08','Car missing from apartment parking');
INSERT INTO FIR VALUES (9,9,11,'2024-07-22','Assault during bar altercation');
INSERT INTO FIR VALUES (10,10,4,'2024-08-14','Armed robbery at Koregaon Park jewellery store');

INSERT INTO Court_Case VALUES (1,2,'Mumbai High Court','Guilty','2024-04-15');
INSERT INTO Court_Case VALUES (2,6,'Allahabad High Court','Acquitted','2024-09-10');
INSERT INTO Court_Case VALUES (3,9,'Delhi District Court','Guilty','2024-10-05');
INSERT INTO Court_Case VALUES (4,12,'Mumbai Sessions Court','Dismissed','2024-10-20');
INSERT INTO Court_Case VALUES (5,15,'Punjab and Haryana HC','Pending','2025-01-15');

INSERT INTO Evidence VALUES (1,1,'CCTV Footage','Camera footage from office lobby','2024-01-16');
INSERT INTO Evidence VALUES (2,2,'Weapon','Knife recovered at crime scene','2024-02-21');
INSERT INTO Evidence VALUES (3,3,'Witness Statement','Statement from bystander','2024-03-07');
INSERT INTO Evidence VALUES (4,4,'Digital Evidence','Email threads showing fraud','2024-04-12');
INSERT INTO Evidence VALUES (5,5,'DNA','Hair sample from crime scene','2024-05-14');
INSERT INTO Evidence VALUES (6,6,'CCTV Footage','Kidnapper caught on camera near school','2024-06-03');
INSERT INTO Evidence VALUES (7,7,'Digital Evidence','Phishing email headers','2024-06-22');
INSERT INTO Evidence VALUES (8,8,'CCTV Footage','Parking lot camera footage','2024-07-10');
INSERT INTO Evidence VALUES (9,9,'Witness Statement','Bartender witness statement','2024-07-24');
INSERT INTO Evidence VALUES (10,10,'Weapon','Firearm recovered near store','2024-08-16');
INSERT INTO Evidence VALUES (11,11,'Document','Forged insurance documents','2024-09-04');
INSERT INTO Evidence VALUES (12,3,'Fingerprint','Fingerprints lifted from weapon','2024-03-08');
INSERT INTO Evidence VALUES (13,5,'Document','Ransom demand letter','2024-05-15');
INSERT INTO Evidence VALUES (14,13,'DNA','Blood sample from scene','2024-10-05');
INSERT INTO Evidence VALUES (15,14,'Digital Evidence','System logs showing breach','2024-10-20');

INSERT INTO Crime_Person VALUES (1,1,'Victim');
INSERT INTO Crime_Person VALUES (2,3,'Suspect');
INSERT INTO Crime_Person VALUES (3,2,'Witness');
INSERT INTO Crime_Person VALUES (4,4,'Victim');
INSERT INTO Crime_Person VALUES (5,9,'Witness');
INSERT INTO Crime_Person VALUES (6,12,'Victim');
INSERT INTO Crime_Person VALUES (7,6,'Victim');
INSERT INTO Crime_Person VALUES (8,7,'Witness');
INSERT INTO Crime_Person VALUES (9,11,'Suspect');
INSERT INTO Crime_Person VALUES (10,10,'Victim');
INSERT INTO Crime_Person VALUES (11,8,'Witness');
INSERT INTO Crime_Person VALUES (12,2,'Victim');
INSERT INTO Crime_Person VALUES (13,5,'Suspect');
INSERT INTO Crime_Person VALUES (14,6,'Witness');
INSERT INTO Crime_Person VALUES (15,3,'Victim');
INSERT INTO Crime_Person VALUES (1,2,'Suspect');
INSERT INTO Crime_Person VALUES (2,1,'Witness');
INSERT INTO Crime_Person VALUES (4,5,'Witness');
INSERT INTO Crime_Person VALUES (5,7,'Suspect');
INSERT INTO Crime_Person VALUES (6,9,'Suspect');

INSERT INTO Case_Officer VALUES (1,1);
INSERT INTO Case_Officer VALUES (1,10);
INSERT INTO Case_Officer VALUES (2,2);
INSERT INTO Case_Officer VALUES (3,1);
INSERT INTO Case_Officer VALUES (3,3);
INSERT INTO Case_Officer VALUES (4,3);
INSERT INTO Case_Officer VALUES (4,4);
INSERT INTO Case_Officer VALUES (5,5);
INSERT INTO Case_Officer VALUES (6,6);
INSERT INTO Case_Officer VALUES (7,7);
INSERT INTO Case_Officer VALUES (7,9);
INSERT INTO Case_Officer VALUES (8,8);
INSERT INTO Case_Officer VALUES (9,2);
INSERT INTO Case_Officer VALUES (10,4);
INSERT INTO Case_Officer VALUES (11,1);
INSERT INTO Case_Officer VALUES (12,2);
INSERT INTO Case_Officer VALUES (13,3);
INSERT INTO Case_Officer VALUES (14,7);
INSERT INTO Case_Officer VALUES (15,5);
INSERT INTO Case_Officer VALUES (15,6);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_crime_status ON Crime(status);
CREATE INDEX idx_crime_type ON Crime(crime_type);
CREATE INDEX idx_crime_date ON Crime(date);
CREATE INDEX idx_casefile_crime ON Case_File(crime_id);
CREATE INDEX idx_casefile_status ON Case_File(case_status);
CREATE INDEX idx_fir_crime ON FIR(crime_id);
CREATE INDEX idx_evidence_case ON Evidence(case_id);
CREATE INDEX idx_person_name ON Person(name);
CREATE INDEX idx_location_city ON Location(city);

-- ============================================================
-- VIEWS
-- ============================================================

CREATE VIEW vw_crime_summary AS
    SELECT c.crime_id, c.crime_type, c.date, c.time, c.status,
           l.address, l.city, l.state
    FROM Crime c
    JOIN Location l ON c.location_id = l.location_id;

CREATE VIEW vw_case_details AS
    SELECT cf.case_id, c.crime_type, c.date AS crime_date,
           po.name AS lead_officer, po.designation,
           cf.case_status, cf.start_date, cf.end_date, l.city
    FROM Case_File cf
    JOIN Crime c ON cf.crime_id = c.crime_id
    JOIN Police_Officer po ON cf.lead_officer_id = po.officer_id
    JOIN Location l ON c.location_id = l.location_id;

CREATE VIEW vw_fir_details AS
    SELECT f.fir_id, c.crime_type, p.name AS filed_by_name,
           f.filing_date, f.description
    FROM FIR f
    JOIN Crime c ON f.crime_id = c.crime_id
    JOIN Person p ON f.filed_by = p.person_id;

-- ============================================================
-- STORED PROCEDURE: GetCaseDetails
-- ============================================================

DELIMITER //
CREATE PROCEDURE GetCaseDetails(IN p_case_id INT)
BEGIN
    SELECT cf.case_id, c.crime_type, c.date AS crime_date,
           c.status AS crime_status, po.name AS lead_officer,
           cf.case_status, cf.start_date, l.city AS location
    FROM Case_File cf
    JOIN Crime c ON cf.crime_id = c.crime_id
    JOIN Police_Officer po ON cf.lead_officer_id = po.officer_id
    JOIN Location l ON c.location_id = l.location_id
    WHERE cf.case_id = p_case_id;

    SELECT e.evidence_type, e.description, e.collected_date
    FROM Evidence e
    WHERE e.case_id = p_case_id;
END //
DELIMITER ;

-- ============================================================
-- STORED FUNCTION: GetCrimeCount
-- ============================================================

DELIMITER //
CREATE FUNCTION GetCrimeCount(p_city VARCHAR(100))
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE crime_count INT;
    SELECT COUNT(*) INTO crime_count
    FROM Crime c
    JOIN Location l ON c.location_id = l.location_id
    WHERE l.city = p_city;
    RETURN crime_count;
END //
DELIMITER ;

-- ============================================================
-- TRIGGER: after_crime_insert
-- ============================================================

DELIMITER //
CREATE TRIGGER after_crime_insert
    AFTER INSERT ON Crime
    FOR EACH ROW
BEGIN
    INSERT INTO Case_File (crime_id, lead_officer_id, case_status, start_date)
    VALUES (NEW.crime_id, 1, 'Open', CURDATE());
END //
DELIMITER ;

-- ============================================================
-- CURSOR PROCEDURE: ListOpenCases
-- ============================================================

DELIMITER //
CREATE PROCEDURE ListOpenCases()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_case_id INT;
    DECLARE v_crime_type VARCHAR(50);
    DECLARE v_officer VARCHAR(100);

    DECLARE case_cursor CURSOR FOR
        SELECT cf.case_id, c.crime_type, po.name
        FROM Case_File cf
        JOIN Crime c ON cf.crime_id = c.crime_id
        JOIN Police_Officer po ON cf.lead_officer_id = po.officer_id
        WHERE cf.case_status = 'Open';

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN case_cursor;
    read_loop: LOOP
        FETCH case_cursor INTO v_case_id, v_crime_type, v_officer;
        IF done THEN LEAVE read_loop; END IF;
        SELECT v_case_id AS CaseID, v_crime_type AS CrimeType, v_officer AS LeadOfficer;
    END LOOP;
    CLOSE case_cursor;
END //
DELIMITER ;

-- ============================================================
-- SAMPLE SELECT QUERIES
-- ============================================================

-- Query 1: All crimes with their location
-- SELECT c.crime_id, c.crime_type, c.date, c.status, l.address, l.city, l.state
-- FROM Crime c JOIN Location l ON c.location_id = l.location_id;

-- Query 2: Open cases with lead officer name
-- SELECT cf.case_id, c.crime_type, po.name AS lead_officer, cf.case_status, cf.start_date
-- FROM Case_File cf
-- JOIN Crime c ON cf.crime_id = c.crime_id
-- JOIN Police_Officer po ON cf.lead_officer_id = po.officer_id
-- WHERE cf.case_status = 'Open';

-- Query 3: People involved in crimes and their role
-- SELECT p.name, p.gender, cp.role, c.crime_type, c.date
-- FROM Crime_Person cp
-- JOIN Person p ON cp.person_id = p.person_id
-- JOIN Crime c ON cp.crime_id = c.crime_id
-- ORDER BY c.date;

-- Query 4: All evidence for case 1
-- SELECT e.evidence_id, e.evidence_type, e.description, e.collected_date
-- FROM Evidence e WHERE e.case_id = 1;

-- Query 5: Crime count per city
-- SELECT l.city, COUNT(c.crime_id) AS total_crimes
-- FROM Crime c JOIN Location l ON c.location_id = l.location_id
-- GROUP BY l.city ORDER BY total_crimes DESC;

-- Query 6: Court cases with verdict
-- SELECT cc.court_case_id, cf.case_id, c.crime_type, cc.court_name, cc.verdict, cc.hearing_date
-- FROM Court_Case cc
-- JOIN Case_File cf ON cc.case_id = cf.case_id
-- JOIN Crime c ON cf.crime_id = c.crime_id;

-- Query 7: Officers and their station
-- SELECT po.name, po.designation, po.badge_number, ps.station_name
-- FROM Police_Officer po JOIN Police_Station ps ON po.station_id = ps.station_id;

-- ============================================================
-- TRANSACTION EXAMPLES (as comments to show the pattern)
-- ============================================================

-- Transaction 1: Adding a crime + its FIR together (COMMIT)
-- START TRANSACTION;
-- INSERT INTO Crime (crime_type, date, time, location_id, description, status)
--   VALUES ('Theft','2024-09-15','11:30:00',1,'Mobile phone snatched','Open');
-- SET @new_crime_id = LAST_INSERT_ID();
-- INSERT INTO FIR (crime_id, filed_by, filing_date, description)
--   VALUES (@new_crime_id, 1, '2024-09-15', 'Mobile snatched near metro');
-- COMMIT;

-- Transaction 2: ROLLBACK when something goes wrong
-- START TRANSACTION;
-- UPDATE Case_File SET case_status = 'Closed', end_date = '2024-10-01' WHERE case_id = 7;
-- INSERT INTO Court_Case (case_id, court_name, verdict, hearing_date)
--   VALUES (9999, 'Delhi High Court', 'Guilty', '2024-10-01');
-- -- ^ This would fail due to FK constraint; then:
-- ROLLBACK;

-- Transaction 3: SAVEPOINT for partial rollback
-- START TRANSACTION;
-- INSERT INTO Person (name, age, gender, phone_number, address)
--   VALUES ('Neha Kapoor', 28, 'Female', '9911223344', 'Sector 62, Noida');
-- SAVEPOINT after_person;
-- INSERT INTO Crime (crime_type, date, time, location_id, description, status)
--   VALUES ('Cybercrime', '2024-10-05', '09:00:00', 5, 'Phishing attack', 'Open');
-- SAVEPOINT after_crime;
-- -- if crime insert fails, rollback to after_person:
-- ROLLBACK TO after_crime;
-- INSERT INTO Crime_Person (crime_id, person_id, role)
--   VALUES (LAST_INSERT_ID(), (SELECT person_id FROM Person WHERE name='Neha Kapoor'), 'Victim');
-- COMMIT;
