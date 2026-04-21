-- ============================================================
-- CRIME MANAGEMENT SYSTEM -- COMPLETE DATABASE SETUP
-- Includes: schema, indexes, views, procedures, seed data,
--           audit log entries, and all triggers.
--
-- Run automatically:  npm run setup-db  (from crime-mgmt/backend/)
-- Run via MySQL CLI:  mysql -u root -p < ../database/setup.sql
-- ============================================================

DROP DATABASE IF EXISTS crime_db;
CREATE DATABASE crime_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crime_db;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE Location (
  location_id  INT          PRIMARY KEY AUTO_INCREMENT,
  address      VARCHAR(255),
  city         VARCHAR(100),
  state        VARCHAR(100),
  pincode      VARCHAR(10),
  latitude     DECIMAL(10,7) DEFAULT NULL,
  longitude    DECIMAL(10,7) DEFAULT NULL
);

CREATE TABLE Person (
  person_id    INT          PRIMARY KEY AUTO_INCREMENT,
  name         VARCHAR(100) NOT NULL,
  age          INT,
  gender       VARCHAR(10),
  phone_number VARCHAR(15),
  address      VARCHAR(255)
);

CREATE TABLE Police_Station (
  station_id       INT          PRIMARY KEY AUTO_INCREMENT,
  station_name     VARCHAR(100) NOT NULL,
  location_id      INT,
  jurisdiction_area VARCHAR(255),
  FOREIGN KEY (location_id) REFERENCES Location(location_id)
);

CREATE TABLE Police_Officer (
  officer_id   INT          PRIMARY KEY AUTO_INCREMENT,
  name         VARCHAR(100) NOT NULL,
  designation  VARCHAR(50),
  badge_number VARCHAR(50)  UNIQUE NOT NULL,
  phone_number VARCHAR(15),
  station_id   INT,
  FOREIGN KEY (station_id) REFERENCES Police_Station(station_id)
);

CREATE TABLE Crime (
  crime_id    INT          PRIMARY KEY AUTO_INCREMENT,
  crime_type  VARCHAR(50)  NOT NULL,
  date        DATE         NOT NULL,
  time        TIME,
  location_id INT,
  description TEXT,
  status      VARCHAR(50),
  FOREIGN KEY (location_id) REFERENCES Location(location_id)
);

CREATE TABLE Case_File (
  case_id        INT PRIMARY KEY AUTO_INCREMENT,
  crime_id       INT,
  lead_officer_id INT,
  case_status    VARCHAR(50),
  start_date     DATE,
  end_date       DATE,
  FOREIGN KEY (crime_id)        REFERENCES Crime(crime_id),
  FOREIGN KEY (lead_officer_id) REFERENCES Police_Officer(officer_id)
);

CREATE TABLE Court_Case (
  court_case_id INT  PRIMARY KEY AUTO_INCREMENT,
  case_id       INT,
  court_name    VARCHAR(100),
  verdict       VARCHAR(50),
  hearing_date  DATE,
  FOREIGN KEY (case_id) REFERENCES Case_File(case_id)
);

CREATE TABLE FIR (
  fir_id        INT  PRIMARY KEY AUTO_INCREMENT,
  crime_id      INT,
  filed_by      INT,
  filing_date   DATE NOT NULL,
  description   TEXT,
  FOREIGN KEY (crime_id)  REFERENCES Crime(crime_id),
  FOREIGN KEY (filed_by)  REFERENCES Person(person_id)
);

CREATE TABLE Evidence (
  evidence_id   INT  PRIMARY KEY AUTO_INCREMENT,
  case_id       INT,
  evidence_type VARCHAR(100),
  description   TEXT,
  collected_date DATE,
  file_path     VARCHAR(500) DEFAULT NULL,
  file_name     VARCHAR(255) DEFAULT NULL,
  file_type     VARCHAR(100) DEFAULT NULL,
  FOREIGN KEY (case_id) REFERENCES Case_File(case_id)
);

CREATE TABLE Case_Officer (
  case_id    INT,
  officer_id INT,
  PRIMARY KEY (case_id, officer_id),
  FOREIGN KEY (case_id)    REFERENCES Case_File(case_id),
  FOREIGN KEY (officer_id) REFERENCES Police_Officer(officer_id)
);

CREATE TABLE Crime_Person (
  crime_id   INT,
  person_id  INT,
  role       VARCHAR(20),
  PRIMARY KEY (crime_id, person_id),
  FOREIGN KEY (crime_id)  REFERENCES Crime(crime_id),
  FOREIGN KEY (person_id) REFERENCES Person(person_id)
);

CREATE TABLE Audit_Log (
  log_id      INT          PRIMARY KEY AUTO_INCREMENT,
  table_name  VARCHAR(50)  NOT NULL,
  operation   VARCHAR(10)  NOT NULL,
  record_id   INT,
  changed_by  VARCHAR(100) DEFAULT 'system',
  changed_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  details     TEXT
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_crime_status   ON Crime(status);
CREATE INDEX idx_crime_type     ON Crime(crime_type);
CREATE INDEX idx_crime_date     ON Crime(date);
CREATE INDEX idx_casefile_crime ON Case_File(crime_id);
CREATE INDEX idx_casefile_status ON Case_File(case_status);
CREATE INDEX idx_fir_crime      ON FIR(crime_id);
CREATE INDEX idx_evidence_case  ON Evidence(case_id);
CREATE INDEX idx_person_name    ON Person(name);
CREATE INDEX idx_location_city  ON Location(city);

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

CREATE VIEW vw_suspect_list AS
  SELECT cp.crime_id, c.crime_type, c.date, c.status,
         p.name AS suspect_name, p.age, p.gender, p.phone_number,
         l.city
  FROM Crime_Person cp
  JOIN Crime c ON cp.crime_id = c.crime_id
  JOIN Person p ON cp.person_id = p.person_id
  JOIN Location l ON c.location_id = l.location_id
  WHERE cp.role = 'Suspect';

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
  FROM Evidence e WHERE e.case_id = p_case_id;
END //
DELIMITER ;

-- ============================================================
-- STORED FUNCTION: GetCrimeCount
-- ============================================================
DELIMITER //
CREATE FUNCTION GetCrimeCount(p_city VARCHAR(100))
RETURNS INT DETERMINISTIC
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
-- SEED DATA
-- NOTE: Triggers are created AFTER seed data so that:
--   1. Audit log data can be backdated with historical timestamps
--   2. The court-verdict trigger doesn't interfere with data insertion
--   3. No trigger side-effects during initial data population
-- ============================================================

-- ============================================================
-- Locations (15 rows -- all major Indian cities)
-- ============================================================
INSERT INTO Location VALUES
(1,  '11 Connaught Place',      'New Delhi',  'Delhi',         '110001', 28.6315, 77.2167),
(2,  '45 Marine Lines',         'Mumbai',     'Maharashtra',   '400020', 18.9542, 72.8215),
(3,  '22 MG Road',              'Bengaluru',  'Karnataka',     '560001', 12.9758, 77.6095),
(4,  '14 Anna Salai',           'Chennai',    'Tamil Nadu',    '600002', 13.0604, 80.2496),
(5,  '7 Sector 17C',            'Chandigarh', 'Punjab',        '160017', 30.7412, 76.7804),
(6,  '88 Hazratganj',           'Lucknow',    'Uttar Pradesh', '226001', 26.8491, 80.9462),
(7,  '5 Jubilee Hills Road',    'Hyderabad',  'Telangana',     '500033', 17.4325, 78.4013),
(8,  '33 Park Street',          'Kolkata',    'West Bengal',   '700016', 22.5530, 88.3512),
(9,  '19 FC Road',              'Pune',       'Maharashtra',   '411004', 18.5204, 73.8473),
(10, '66 CG Road',              'Ahmedabad',  'Gujarat',       '380009', 23.0393, 72.5514),
(11, '11 Civil Lines',          'Jaipur',     'Rajasthan',     '302006', 26.9124, 75.7873),
(12, '4 Banjara Hills Road 12', 'Hyderabad',  'Telangana',     '500034', 17.4145, 78.4497),
(13, '77 Lalbagh Road',         'Bengaluru',  'Karnataka',     '560027', 12.9483, 77.5836),
(14, '52 Kalbadevi Road',       'Mumbai',     'Maharashtra',   '400002', 18.9524, 72.8337),
(15, '39 Chowringhee Road',     'Kolkata',    'West Bengal',   '700020', 22.5646, 88.3508);

-- ============================================================
-- Persons (20 rows -- India-specific names and addresses)
-- ============================================================
INSERT INTO Person VALUES
(1,  'Aarav Sharma',   28, 'Male',   '9876501234', '14 Lajpat Nagar, New Delhi'),
(2,  'Priya Sundar',   32, 'Female', '9867234510', '7-B Andheri West, Mumbai'),
(3,  'Karthik Raja',   41, 'Male',   '9845612340', '22 Jayanagar 4th Block, Bengaluru'),
(4,  'Meghna Pillai',  27, 'Female', '9878901234', '45 T Nagar, Chennai'),
(5,  'Gurpreet Singh', 55, 'Male',   '9812234567', '3 Sector 22, Chandigarh'),
(6,  'Nazia Fatima',   30, 'Female', '9901234567', '88 Kaiser Bagh, Lucknow'),
(7,  'Venkat Rao',     48, 'Male',   '9800123456', '12 Madhapur, Hyderabad'),
(8,  'Subhas Mondal',  38, 'Male',   '9811234560', '5 Ballygunge Place, Kolkata'),
(9,  'Shweta Pawar',   26, 'Female', '9822345671', '9 Viman Nagar, Pune'),
(10, 'Jayesh Patel',   44, 'Male',   '9833456782', '17 Navrangpura, Ahmedabad'),
(11, 'Kavita Sharma',  35, 'Female', '9844567893', '6 Vaishali Nagar, Jaipur'),
(12, 'Rohit Nair',     29, 'Male',   '9855678904', '33 Jubilee Hills, Hyderabad'),
(13, 'Sunita Mishra',  42, 'Female', '9866789015', '14 Indiranagar, Bengaluru'),
(14, 'Arif Khan',      37, 'Male',   '9877890126', '21 Malad East, Mumbai'),
(15, 'Pooja Verma',    24, 'Female', '9888901237', '3 Saket, New Delhi'),
(16, 'Dinesh Kumar',   52, 'Male',   '9899012348', '8 Uttam Nagar, New Delhi'),
(17, 'Lakshmi Devi',   46, 'Female', '9810123459', '19 Amjikarai, Chennai'),
(18, 'Aditya Bose',    31, 'Male',   '9821234560', '7 Jadavpur, Kolkata'),
(19, 'Renu Singh',     39, 'Female', '9832345671', '25 Gomti Nagar, Lucknow'),
(20, 'Farhan Sheikh',  33, 'Male',   '9843456782', '11 Bandra West, Mumbai');

-- ============================================================
-- Police Stations (10 rows)
-- ============================================================
INSERT INTO Police_Station VALUES
(1,  'Connaught Place Police Station', 1,  'Central Delhi'),
(2,  'Marine Lines Police Station',    2,  'South Mumbai'),
(3,  'Cubbon Park Police Station',     3,  'Central Bengaluru'),
(4,  'Anna Nagar Police Station',      4,  'Central Chennai'),
(5,  'Sector 17 Police Station',       5,  'Sector 17–20, Chandigarh'),
(6,  'Hazratganj Police Station',      6,  'Central Lucknow'),
(7,  'Jubilee Hills Police Station',   7,  'Jubilee Hills Zone, Hyderabad'),
(8,  'Lalbazar Police Station',        8,  'Central Kolkata'),
(9,  'Shivajinagar Police Station',    9,  'Shivajinagar–Deccan Area, Pune'),
(10, 'Navrangpura Police Station',     10, 'Navrangpura–Satellite, Ahmedabad');

-- ============================================================
-- Police Officers (15 rows -- various ranks)
-- ============================================================
INSERT INTO Police_Officer VALUES
(1,  'DCP Raghav Nanda',         'DCP',           'B2001', '9700100001', 1),
(2,  'Inspector Meera Krishnan', 'Inspector',     'B2002', '9700100002', 2),
(3,  'SI Suresh Naidu',          'Sub-Inspector', 'B2003', '9700100003', 3),
(4,  'Inspector Arun Saxena',    'Inspector',     'B2004', '9700100004', 4),
(5,  'ASP Jaspal Kalra',         'ASP',           'B2005', '9700100005', 5),
(6,  'Inspector Neha Tiwari',    'Inspector',     'B2006', '9700100006', 6),
(7,  'SI Ravi Shankar',          'Sub-Inspector', 'B2007', '9700100007', 7),
(8,  'Inspector PK Das',         'Inspector',     'B2008', '9700100008', 8),
(9,  'SI Anand Kulkarni',        'Sub-Inspector', 'B2009', '9700100009', 9),
(10, 'HC Bhupesh Desai',         'Head Constable','B2010', '9700100010', 10),
(11, 'Inspector Smita Joshi',    'Inspector',     'B2011', '9700100011', 9),
(12, 'SI Yusuf Ali',             'Sub-Inspector', 'B2012', '9700100012', 1),
(13, 'ASP Divya Menon',          'ASP',           'B2013', '9700100013', 7),
(14, 'Inspector Tejpal Singh',   'Inspector',     'B2014', '9700100014', 5),
(15, 'HC Rupa Ganguly',          'Head Constable','B2015', '9700100015', 8);

-- ============================================================
-- Crimes (25 rows -- diverse types across Indian cities)
-- ============================================================
INSERT INTO Crime VALUES
(1,  'Theft',      '2024-01-20', '14:30:00', 1,  'Apple MacBook stolen from Barista cafe, Connaught Place. Owner Aarav Sharma stepped away briefly; laptop removed from table.', 'Open'),
(2,  'Robbery',    '2024-02-10', '22:00:00', 2,  'Armed robbery at SBI ATM kiosk on Marine Lines. Cash drawer emptied at gunpoint by two helmeted men. Approximately Rs 2.8 lakh stolen.', 'Closed'),
(3,  'Assault',    '2024-03-07', '19:00:00', 3,  'Street brawl near Brigade Road metro exit. Two men attacked a pedestrian with iron rods over a parking dispute.', 'Under Investigation'),
(4,  'Fraud',      '2024-04-12', '09:30:00', 4,  'UPI fraud of Rs 3.2 lakh via fake HDFC customer care call. Victim Meghna Pillai tricked into sharing OTP by impersonator.', 'Under Investigation'),
(5,  'Murder',     '2024-05-15', '03:00:00', 5,  'Unidentified male body discovered in Leisure Valley park, Chandigarh. Blunt-force trauma to head. No ID found on body.', 'Open'),
(6,  'Kidnapping', '2024-06-03', '16:00:00', 6,  '7-year-old girl abducted from outside school gate near Hazratganj. Ransom demand of Rs 10 lakh received via unknown mobile number.', 'Closed'),
(7,  'Cybercrime', '2024-06-22', '11:30:00', 7,  'Phishing attack targeting HDFC customers in Jubilee Hills. Rs 1.82 lakh fraudulently transferred after victim clicked fake NetBanking link.', 'Open'),
(8,  'Theft',      '2024-07-09', '13:45:00', 9,  'Honda City (White, MH-12-AB-1234) stolen from secured gated society parking lot. Barrier camera found tampered.', 'Under Investigation'),
(9,  'Assault',    '2024-07-25', '21:00:00', 8,  'Domestic violence — husband repeatedly assaulted wife at Park Street residence. Victim sustained facial and torso injuries.', 'Closed'),
(10, 'Robbery',    '2024-08-16', '20:30:00', 10, 'Jewellery store robbery at Tribhovandas CG Road outlet. Four masked men with firearms made off with 24 gold pieces and Rs 3.8 lakh cash.', 'Under Investigation'),
(11, 'Fraud',      '2024-09-02', '10:00:00', 1,  'Fake investment scheme promising 30 percent monthly returns. Pooja Verma defrauded of Rs 8 lakh by fake firm Jupiter Returns LLP.', 'Open'),
(12, 'Theft',      '2024-09-18', '17:00:00', 2,  'iPhone 15 Pro snatched from Aarav Sharma at Marine Drive traffic signal by motorcyclist on KA-03 series bike.', 'Closed'),
(13, 'Murder',     '2024-10-05', '04:00:00', 3,  'Stabbing death in MG Road apartment following prolonged property dispute. Victim found by neighbour at dawn with multiple chest wounds.', 'Under Investigation'),
(14, 'Cybercrime', '2024-10-20', '09:00:00', 7,  'Data breach at IT park company in Hyderabad. 52,000 customer records including Aadhaar and credit card data exfiltrated via SQL injection.', 'Open'),
(15, 'Kidnapping', '2024-11-08', '17:30:00', 11, 'Businesswoman Kavita Sharma kidnapped returning from office in Jaipur. Held for 3 days. Rs 50 lakh ransom paid. Three suspects identified from call metadata.', 'Closed'),
(16, 'Vandalism',  '2024-11-22', '23:00:00', 1,  'Heritage building on Connaught Place Inner Circle defaced with spray paint. Slogans written across three panels. Area under CCTV surveillance.', 'Open'),
(17, 'Extortion',  '2024-12-04', '18:00:00', 14, 'Spice merchant at Kalbadevi, Mumbai threatened with physical harm unless monthly Rs 15,000 protection money paid to local gang.', 'Under Investigation'),
(18, 'Burglary',   '2024-12-19', '02:30:00', 9,  'Flat on FC Road burgled while owners were vacationing in Goa. Gold jewellery, two laptops, and cash totalling Rs 2.5 lakh stolen.', 'Open'),
(19, 'Assault',    '2025-01-10', '20:00:00', 8,  'Road rage incident outside Park Hotel, Kolkata. Driver assaulted by group of five after minor traffic altercation. Victim hospitalized.', 'Under Investigation'),
(20, 'Fraud',      '2025-01-25', '11:00:00', 4,  'Fake lawyer scam in Chennai. Fraudster promised resolution of property case in exchange for Rs 5 lakh advance fee and then disappeared.', 'Open'),
(21, 'Theft',      '2025-02-08', '16:00:00', 12, 'Gold chain snatched from morning jogger near Banjara Hills Road No. 12, Hyderabad. Suspect fled on a red Pulsar motorcycle.', 'Under Investigation'),
(22, 'Murder',     '2025-02-20', '01:00:00', 6,  'Gang-related shooting in Hazratganj, Lucknow. Victim sustained three gunshot wounds. Suspected drug-territory dispute. Three witnesses detained.', 'Open'),
(23, 'Cybercrime', '2025-03-05', '10:30:00', 13, 'Instagram account of PG aspirant hacked. Followers targeted with fake NGO donation link; Rs 1.5 lakh extorted. Suspect IP traced to Noida.', 'Under Investigation'),
(24, 'Robbery',    '2025-03-18', '14:00:00', 5,  'Attempted bank robbery at PNB Sector 17 Chandigarh foiled by armed guard. One suspect (Arif Khan) arrested at scene; two fled.', 'Closed'),
(25, 'Kidnapping', '2025-04-01', '09:00:00', 11, 'PG college student abducted from Jaipur hostel area on way to morning classes. Vehicle spotted on CCTV — white Scorpio (RJ-14 series).', 'Open');

-- ============================================================
-- Case Files (24 rows)
-- Note: No trigger active during this insert -- inserted manually
-- ============================================================
INSERT INTO Case_File VALUES
(1,  1,  12, 'Open',              '2024-01-21', NULL),
(2,  2,  2,  'Closed',            '2024-02-12', '2024-04-20'),
(3,  3,  3,  'Under Investigation','2024-03-08', NULL),
(4,  4,  4,  'Under Investigation','2024-04-13', NULL),
(5,  5,  14, 'Open',              '2024-05-16', NULL),
(6,  6,  6,  'Closed',            '2024-06-04', '2024-08-15'),
(7,  7,  13, 'Open',              '2024-06-23', NULL),
(8,  8,  11, 'Under Investigation','2024-07-10', NULL),
(9,  9,  8,  'Closed',            '2024-07-26', '2024-09-10'),
(10, 10, 10, 'Under Investigation','2024-08-17', NULL),
(11, 11, 1,  'Open',              '2024-09-04', NULL),
(12, 12, 2,  'Closed',            '2024-09-19', '2024-11-05'),
(13, 13, 3,  'Under Investigation','2024-10-06', NULL),
(14, 14, 13, 'Open',              '2024-10-22', NULL),
(15, 15, 5,  'Closed',            '2024-11-09', '2025-01-20'),
(16, 16, 1,  'Open',              '2024-11-23', NULL),
(17, 17, 2,  'Under Investigation','2024-12-05', NULL),
(18, 18, 9,  'Open',              '2024-12-20', NULL),
(19, 19, 8,  'Under Investigation','2025-01-11', NULL),
(20, 20, 4,  'Open',              '2025-01-26', NULL),
(21, 21, 7,  'Under Investigation','2025-02-09', NULL),
(22, 22, 6,  'Open',              '2025-02-21', NULL),
(23, 24, 14, 'Closed',            '2025-03-19', '2025-04-10'),
(24, 25, 5,  'Open',              '2025-04-02', NULL);

-- ============================================================
-- FIRs (15 rows -- filing dates on or after crime dates)
-- ============================================================
INSERT INTO FIR VALUES
(1,  1,  1,  '2024-01-20', 'Apple MacBook Pro (Silver, 13-inch M2) stolen from Barista, Connaught Place. Complainant Aarav Sharma stepped away for 5 minutes. Device last seen on table near window seat.'),
(2,  2,  20, '2024-02-11', 'Complainant Farhan Sheikh witnessed two helmeted men rob SBI ATM at knifepoint. Approximately Rs 2.8 lakh taken. Witness threatened not to call police.'),
(3,  3,  3,  '2024-03-07', 'Karthik Raja filing on behalf of victim -- two men attacked a pedestrian with iron rods near Brigade Road metro exit over a parking space dispute.'),
(4,  4,  4,  '2024-04-12', 'UPI fraud complaint by Meghna Pillai. Received call from impersonator claiming to be HDFC executive. Shared OTP and immediately saw Rs 3,20,000 debited.'),
(5,  5,  5,  '2024-05-16', 'Body of unidentified male (approx. 35-45 years) discovered by Gurpreet Singh on morning walk in Leisure Valley Park. Head injuries consistent with blunt-force trauma. No identification on body.'),
(6,  6,  6,  '2024-06-03', 'Complaint by Nazia Fatima -- daughter Ayesha (7 years) did not return from school. Unknown male seen waiting near school gate at 3:30 PM. Ransom call received at 6 PM demanding Rs 10 lakh.'),
(7,  7,  7,  '2024-06-23', 'Venkat Rao reports Rs 1,82,000 debited from HDFC account after clicking link in email purporting to be from HDFC NetBanking. IP traced to VPN exit node in Singapore.'),
(8,  8,  9,  '2024-07-09', 'Shweta Pawar reports Honda City (White, MH-12-AB-1234) stolen from gated society between 2 PM and 8 PM. Parking barrier camera wire was cut. Vehicle had ETC tag active.'),
(9,  9,  8,  '2024-07-26', 'Subhas Mondal filing on behalf of spouse. Husband Ramesh Roy (35) assaulted wife with belt and slippers multiple times. Victim has medical certificate. Neighbour Mrs. Chatterjee witnessed shouting.'),
(10, 10, 10, '2024-08-17', 'Jayesh Patel, owner of TBZ outlet CG Road, reports armed robbery at closing time. Four masked men with revolvers took 24 gold ornaments and Rs 3.8 lakh cash. Store CCTV partially operational.'),
(11, 11, 15, '2024-09-03', 'Pooja Verma reports investment fraud. Paid Rs 8 lakh in three instalments to Jupiter Returns LLP for promised 30 percent monthly returns. Company office vacated by second month; phones switched off.'),
(12, 12, 1,  '2024-09-18', 'Aarav Sharma reports mobile phone (iPhone 15 Pro, 256GB Natural Titanium) snatched at Nariman Point signal by pillion rider on KA-03 series motorcycle. Partial number plate noted.'),
(13, 13, 13, '2024-10-06', 'Sunita Mishra, neighbour, reports body of Rajesh Gupta found at 4 AM. Blood pooled near kitchen. Multiple sharp-force wounds. Deceased had reported property dispute with cousin two weeks prior.'),
(14, 14, 7,  '2024-10-21', 'Venkat Rao, CTO of TechSphere Solutions, reports detection of unauthorized data exfiltration. SQL injection fingerprints found in logs. Dark web listing of 52,000 customer records identified by cyber cell.'),
(15, 15, 11, '2024-11-09', 'Kavita Sharma self-filing after release. Held for 3 days at undisclosed location. Rs 50 lakh ransom paid via hawala by family. Three distinct voices on ransom calls. WhatsApp screenshots preserved.');

-- ============================================================
-- Court Cases (8 rows -- India-specific court names)
-- ============================================================
INSERT INTO Court_Case VALUES
(1, 2,  'Mumbai Sessions Court',         'Guilty',    '2024-06-15'),
(2, 6,  'Allahabad High Court',           'Guilty',    '2024-10-10'),
(3, 9,  'Calcutta High Court',            'Guilty',    '2024-11-20'),
(4, 12, 'Bombay High Court',              'Dismissed', '2025-01-10'),
(5, 15, 'Rajasthan High Court',           'Pending',   '2025-04-20'),
(6, 23, 'Punjab and Haryana High Court',  'Acquitted', '2025-05-05'),
(7, 1,  'Delhi High Court',               'Pending',   '2025-03-01'),
(8, 4,  'Madras High Court',              'Pending',   '2025-05-15');

-- ============================================================
-- Evidence (20 rows)
-- ============================================================
INSERT INTO Evidence (evidence_id, case_id, evidence_type, description, collected_date) VALUES
(1,  1,  'CCTV Footage',      'Barista cafe CCTV showing suspect in grey hoodie removing a laptop from the table and walking out via side exit at 14:37 hrs.', '2024-01-22'),
(2,  1,  'Digital Evidence',  'Cafe Wi-Fi router logs showing device MAC address (D0-E1-40-xx-xx) active and then disappearing abruptly at 14:38 hrs. Logs exported and verified.', '2024-01-23'),
(3,  2,  'Weapon',            'Improvised country-made pistol (katta) recovered from storm drain behind ATM kiosk during search. Sent to Ballistic Research Laboratory Mumbai.', '2024-02-13'),
(4,  2,  'Witness Statement', 'Written statement by eyewitness Abhay Mehta: saw two men approx 5ft 9in, helmets on, exiting ATM hurriedly at 22:05 hrs; one counted cash before fleeing on Yamaha FZ.', '2024-02-14'),
(5,  3,  'Witness Statement', 'Statements recorded from two autorickshaw drivers who witnessed the altercation and called PCR van. Both identified the primary assailant from a photo lineup.', '2024-03-09'),
(6,  3,  'CCTV Footage',      'BBMP traffic camera footage at Brigade Road crossing showing altercation at 19:03 hrs. Two assailants visible. Partial face of primary attacker captured.', '2024-03-10'),
(7,  4,  'Digital Evidence',  'Screen-recorded video of fraudulent UPI transaction provided by victim from her phone. Transaction ID: UPI202404120000312. Timestamp verified by NPCI.', '2024-04-14'),
(8,  4,  'Document',          'Scan of fake bank notice printed on near-perfect HDFC letterhead, forged signature of Branch Manager Mr. R. Sharma. Paper and ink sent for forensic analysis.', '2024-04-15'),
(9,  5,  'DNA',               'Hair samples collected from park bench near body. Sendmarked to CFSL Chandigarh for forensic DNA analysis. Case reference: CFSL/CHD/2024/0715.', '2024-05-17'),
(10, 5,  'Document',          'Unsigned chit found in victim pocket with Hindi text meaning You were warned. Handwriting samples being matched against known offenders in CCTNS database.', '2024-05-18'),
(11, 6,  'CCTV Footage',      'School gate surveillance camera captured kidnapper vehicle -- white Innova Crysta (UP-32 prefix) parked for 40 minutes before incident. Plate partially obscured.', '2024-06-05'),
(12, 7,  'Digital Evidence',  'Phishing email full headers traced through Russian IP then VPN exit node in Singapore. Email body and payload analysed. Linked to FIN7 phishing kit variant.', '2024-06-24'),
(13, 8,  'CCTV Footage',      'Society parking camera footage shows two individuals on foot cutting barrier cable at 01:47 hrs. One suspect partially visible without helmet for 3 seconds.', '2024-07-11'),
(14, 9,  'Witness Statement', 'Mrs. Chatterjee (neighbour) corroborates victim account. Heard shouting and impact sounds between 21:00 and 22:00 hrs. Did not see the person enter/exit.', '2024-07-28'),
(15, 10, 'Weapon',            'Two country revolvers and three motorcycle helmets recovered from abandoned flat in Maninagar, Ahmedabad following tip from informer. Revolvers bore-tested.', '2024-08-18'),
(16, 10, 'CCTV Footage',      'In-store TBZ security camera and neighbouring HDFC ATM external camera captured full robbery from entry (20:28) to exit (20:41). Faces obscured by masks.', '2024-08-19'),
(17, 11, 'Document',          'Forged company registration certificate, GSTIN document, and PAN card of fake investment firm Jupiter Returns LLP obtained from Registrar of Companies database.', '2024-09-05'),
(18, 13, 'DNA',               'Blood smear on kitchen knife found in downstairs dustbin. Sent to Bengaluru FSL for DNA profiling. Preliminary match with victim Rajesh Gupta blood type.', '2024-10-07'),
(19, 14, 'Digital Evidence',  'IDS server logs with SQL injection fingerprints. Dark web link to data dump posted on BreachForums verified by Hyderabad Cyber Cell. Hash matches stolen dataset.', '2024-10-23'),
(20, 15, 'Document',          'WhatsApp ransom demand screenshots and call recordings extracted under legal warrant from victim phone. Voice analysis sent to CFSL New Delhi for speaker identification.', '2024-11-10');

-- ============================================================
-- Crime_Person (48 rows -- victims, suspects, witnesses)
-- ============================================================
INSERT INTO Crime_Person VALUES
(1,  1,  'Victim'),   (1,  16, 'Suspect'),
(2,  20, 'Victim'),   (2,  14, 'Suspect'),  (2,  3,  'Witness'),
(3,  18, 'Victim'),   (3,  8,  'Suspect'),  (3,  3,  'Witness'), (3, 12, 'Witness'),
(4,  4,  'Victim'),   (4,  17, 'Suspect'),
(5,  5,  'Witness'),
(6,  6,  'Victim'),   (6,  19, 'Suspect'),
(7,  7,  'Victim'),   (7,  12, 'Suspect'),
(8,  9,  'Victim'),   (8,  18, 'Witness'),
(9,  8,  'Victim'),   (9,  13, 'Witness'),
(10, 10, 'Victim'),   (10, 20, 'Suspect'),  (10, 3,  'Witness'),
(11, 15, 'Victim'),   (11, 16, 'Suspect'),
(12, 1,  'Victim'),   (12, 14, 'Suspect'),
(13, 3,  'Suspect'),  (13, 13, 'Witness'),
(14, 7,  'Victim'),   (14, 12, 'Witness'),
(15, 11, 'Victim'),   (15, 19, 'Suspect'),
(16, 15, 'Witness'),
(17, 20, 'Victim'),
(18, 9,  'Victim'),   (18, 10, 'Witness'),
(19, 18, 'Victim'),   (19, 8,  'Suspect'),
(20, 17, 'Victim'),   (20, 4,  'Witness'),
(21, 12, 'Victim'),
(22, 6,  'Victim'),   (22, 19, 'Suspect'),
(23, 2,  'Victim'),
(24, 5,  'Witness'),  (24, 14, 'Suspect'),
(25, 11, 'Victim'),   (25, 16, 'Suspect');

-- ============================================================
-- Case_Officer (30 rows -- officers assigned to cases)
-- ============================================================
INSERT INTO Case_Officer VALUES
(1,  12), (1,  1),
(2,  2),  (2,  3),
(3,  3),  (3,  11),
(4,  4),
(5,  14), (5,  5),
(6,  6),
(7,  13), (7,  7),
(8,  11), (8,  9),
(9,  8),  (9,  15),
(10, 10),
(11, 1),  (11, 12),
(12, 2),
(13, 3),
(14, 13), (14, 7),
(15, 5),  (15, 14),
(16, 1),
(17, 2),  (17, 4),
(18, 9),  (18, 11),
(19, 8),
(20, 4),
(21, 7),  (21, 13),
(22, 6),
(23, 14), (23, 5),
(24, 5);

-- ============================================================
-- Audit_Log (75 rows -- backdated historical entries)
-- ============================================================
INSERT INTO Audit_Log (table_name, operation, record_id, details, changed_at) VALUES
-- Crime INSERT events (25)
('Crime', 'INSERT', 1,  'Type:Theft | Date:2024-01-20 | Location:Connaught Place | Status:Open', '2024-01-20 14:35:00'),
('Crime', 'INSERT', 2,  'Type:Robbery | Date:2024-02-10 | Location:Mumbai | Status:Open', '2024-02-10 22:10:00'),
('Crime', 'INSERT', 3,  'Type:Assault | Date:2024-03-07 | Location:Bengaluru | Status:Open', '2024-03-07 19:20:00'),
('Crime', 'INSERT', 4,  'Type:Fraud | Date:2024-04-12 | Location:Chennai | Status:Open', '2024-04-12 09:45:00'),
('Crime', 'INSERT', 5,  'Type:Murder | Date:2024-05-15 | Location:Chandigarh | Status:Open', '2024-05-15 06:10:00'),
('Crime', 'INSERT', 6,  'Type:Kidnapping | Date:2024-06-03 | Location:Lucknow | Status:Open', '2024-06-03 16:40:00'),
('Crime', 'INSERT', 7,  'Type:Cybercrime | Date:2024-06-22 | Location:Hyderabad | Status:Open', '2024-06-23 09:00:00'),
('Crime', 'INSERT', 8,  'Type:Theft | Date:2024-07-09 | Location:Pune | Status:Open', '2024-07-09 20:10:00'),
('Crime', 'INSERT', 9,  'Type:Assault | Date:2024-07-25 | Location:Kolkata | Status:Open', '2024-07-26 08:00:00'),
('Crime', 'INSERT', 10, 'Type:Robbery | Date:2024-08-16 | Location:Ahmedabad | Status:Open', '2024-08-16 23:15:00'),
('Crime', 'INSERT', 11, 'Type:Fraud | Date:2024-09-02 | Location:New Delhi | Status:Open', '2024-09-03 08:30:00'),
('Crime', 'INSERT', 12, 'Type:Theft | Date:2024-09-18 | Location:Mumbai | Status:Open', '2024-09-18 17:40:00'),
('Crime', 'INSERT', 13, 'Type:Murder | Date:2024-10-05 | Location:Bengaluru | Status:Open', '2024-10-05 06:30:00'),
('Crime', 'INSERT', 14, 'Type:Cybercrime | Date:2024-10-20 | Location:Hyderabad | Status:Open', '2024-10-20 10:10:00'),
('Crime', 'INSERT', 15, 'Type:Kidnapping | Date:2024-11-08 | Location:Jaipur | Status:Open', '2024-11-08 18:45:00'),
('Crime', 'INSERT', 16, 'Type:Vandalism | Date:2024-11-22 | Location:New Delhi | Status:Open', '2024-11-23 00:35:00'),
('Crime', 'INSERT', 17, 'Type:Extortion | Date:2024-12-04 | Location:Mumbai | Status:Open', '2024-12-04 18:40:00'),
('Crime', 'INSERT', 18, 'Type:Burglary | Date:2024-12-19 | Location:Pune | Status:Open', '2024-12-19 07:10:00'),
('Crime', 'INSERT', 19, 'Type:Assault | Date:2025-01-10 | Location:Kolkata | Status:Open', '2025-01-10 21:00:00'),
('Crime', 'INSERT', 20, 'Type:Fraud | Date:2025-01-25 | Location:Chennai | Status:Open', '2025-01-26 08:10:00'),
('Crime', 'INSERT', 21, 'Type:Theft | Date:2025-02-08 | Location:Hyderabad | Status:Open', '2025-02-08 17:10:00'),
('Crime', 'INSERT', 22, 'Type:Murder | Date:2025-02-20 | Location:Lucknow | Status:Open', '2025-02-20 04:20:00'),
('Crime', 'INSERT', 23, 'Type:Cybercrime | Date:2025-03-05 | Location:Bengaluru | Status:Open', '2025-03-05 11:00:00'),
('Crime', 'INSERT', 24, 'Type:Robbery | Date:2025-03-18 | Location:Chandigarh | Status:Open', '2025-03-18 14:40:00'),
('Crime', 'INSERT', 25, 'Type:Kidnapping | Date:2025-04-01 | Location:Jaipur | Status:Open', '2025-04-01 09:30:00'),
-- Crime UPDATE events (status changes as investigations progressed)
('Crime', 'UPDATE', 2,  'Status: Open → Closed | Robbery solved, suspects arrested', '2024-04-20 11:00:00'),
('Crime', 'UPDATE', 6,  'Status: Open → Closed | Child recovered, kidnappers arrested', '2024-08-15 16:00:00'),
('Crime', 'UPDATE', 9,  'Status: Open → Closed | Domestic violence case concluded', '2024-09-10 10:00:00'),
('Crime', 'UPDATE', 12, 'Status: Open → Closed | Snatching case closed, court dismissed', '2024-11-05 12:00:00'),
('Crime', 'UPDATE', 15, 'Status: Open → Closed | Kidnapping victim released, suspects in custody', '2025-01-20 14:00:00'),
('Crime', 'UPDATE', 24, 'Status: Open → Closed | Attempted robbery foiled, suspect arrested', '2025-04-10 09:00:00'),
('Crime', 'UPDATE', 3,  'Status: Open → Under Investigation | Witness statements recorded', '2024-03-15 10:00:00'),
('Crime', 'UPDATE', 4,  'Status: Open → Under Investigation | Digital evidence collected', '2024-04-20 11:30:00'),
('Crime', 'UPDATE', 8,  'Status: Open → Under Investigation | Forensic analysis of parking camera', '2024-07-20 09:00:00'),
('Crime', 'UPDATE', 10, 'Status: Open → Under Investigation | Weapons and CCTV recovered', '2024-08-25 12:00:00'),
-- Case_File INSERT events
('Case_File', 'INSERT', 1,  'CrimeID:1 | LeadOfficer:SI Yusuf Ali | Status:Open | Started:2024-01-21', '2024-01-21 09:00:00'),
('Case_File', 'INSERT', 2,  'CrimeID:2 | LeadOfficer:Inspector Meera Krishnan | Status:Open | Started:2024-02-12', '2024-02-12 08:30:00'),
('Case_File', 'INSERT', 5,  'CrimeID:5 | LeadOfficer:Inspector Tejpal Singh | Status:Open | Started:2024-05-16', '2024-05-16 08:00:00'),
('Case_File', 'INSERT', 6,  'CrimeID:6 | LeadOfficer:Inspector Neha Tiwari | Status:Open | Started:2024-06-04', '2024-06-04 08:00:00'),
('Case_File', 'INSERT', 10, 'CrimeID:10 | LeadOfficer:HC Bhupesh Desai | Status:Open | Started:2024-08-17', '2024-08-17 08:00:00'),
-- Case_File UPDATE events (status changes)
('Case_File', 'UPDATE', 2,  'Status: Open → Closed | End date set to 2024-04-20', '2024-04-20 11:05:00'),
('Case_File', 'UPDATE', 6,  'Status: Open → Closed | End date set to 2024-08-15', '2024-08-15 16:05:00'),
('Case_File', 'UPDATE', 9,  'Status: Open → Closed | End date set to 2024-09-10', '2024-09-10 10:05:00'),
('Case_File', 'UPDATE', 12, 'Status: Open → Closed | End date set to 2024-11-05', '2024-11-05 12:05:00'),
('Case_File', 'UPDATE', 15, 'Status: Open → Closed | End date set to 2025-01-20', '2025-01-20 14:05:00'),
-- FIR INSERT events
('FIR', 'INSERT', 1,  'CrimeID:1 | FiledBy:Aarav Sharma | Date:2024-01-20', '2024-01-20 16:00:00'),
('FIR', 'INSERT', 2,  'CrimeID:2 | FiledBy:Farhan Sheikh | Date:2024-02-11', '2024-02-11 10:00:00'),
('FIR', 'INSERT', 5,  'CrimeID:5 | FiledBy:Gurpreet Singh | Date:2024-05-16', '2024-05-16 07:30:00'),
('FIR', 'INSERT', 6,  'CrimeID:6 | FiledBy:Nazia Fatima | Date:2024-06-03', '2024-06-03 17:30:00'),
('FIR', 'INSERT', 10, 'CrimeID:10 | FiledBy:Jayesh Patel | Date:2024-08-17', '2024-08-17 09:00:00'),
('FIR', 'INSERT', 14, 'CrimeID:14 | FiledBy:Venkat Rao | Date:2024-10-21', '2024-10-21 11:00:00'),
('FIR', 'INSERT', 15, 'CrimeID:15 | FiledBy:Kavita Sharma | Date:2024-11-09', '2024-11-09 10:00:00'),
-- Evidence INSERT events
('Evidence', 'INSERT', 1,  'Type:CCTV Footage | CaseID:1 | Collected:2024-01-22', '2024-01-22 14:00:00'),
('Evidence', 'INSERT', 3,  'Type:Weapon | CaseID:2 | Collected:2024-02-13', '2024-02-13 11:00:00'),
('Evidence', 'INSERT', 9,  'Type:DNA | CaseID:5 | Collected:2024-05-17', '2024-05-17 15:00:00'),
('Evidence', 'INSERT', 15, 'Type:Weapon | CaseID:10 | Collected:2024-08-18', '2024-08-18 12:00:00'),
('Evidence', 'INSERT', 19, 'Type:Digital Evidence | CaseID:14 | Collected:2024-10-23', '2024-10-23 10:00:00'),
('Evidence', 'INSERT', 20, 'Type:Document | CaseID:15 | Collected:2024-11-10', '2024-11-10 14:00:00'),
-- Court Case INSERT events
('Court_Case', 'INSERT', 1, 'CaseID:2 | Court:Mumbai Sessions Court | Verdict:Guilty | Hearing:2024-06-15', '2024-06-15 17:00:00'),
('Court_Case', 'INSERT', 2, 'CaseID:6 | Court:Allahabad High Court | Verdict:Guilty | Hearing:2024-10-10', '2024-10-10 15:30:00'),
('Court_Case', 'INSERT', 3, 'CaseID:9 | Court:Calcutta High Court | Verdict:Guilty | Hearing:2024-11-20', '2024-11-20 14:00:00'),
('Court_Case', 'INSERT', 4, 'CaseID:12 | Court:Bombay High Court | Verdict:Dismissed | Hearing:2025-01-10', '2025-01-10 12:00:00'),
('Court_Case', 'INSERT', 5, 'CaseID:15 | Court:Rajasthan High Court | Verdict:Pending | Hearing:2025-04-20', '2024-11-15 10:00:00'),
('Court_Case', 'INSERT', 6, 'CaseID:23 | Court:Punjab and Haryana HC | Verdict:Acquitted | Hearing:2025-05-05', '2025-04-01 09:00:00'),
-- Crime_Person entries (suspect/victim assignments logged)
('Crime_Person', 'INSERT', 1,  'PersonID:16 (Dinesh Kumar) | Role:Suspect | CrimeID:1 Theft', '2024-01-22 10:00:00'),
('Crime_Person', 'INSERT', 2,  'PersonID:14 (Arif Khan) | Role:Suspect | CrimeID:2 Robbery', '2024-02-13 12:00:00'),
('Crime_Person', 'INSERT', 6,  'PersonID:19 (Renu Singh) | Role:Suspect | CrimeID:6 Kidnapping', '2024-06-05 09:00:00'),
('Crime_Person', 'INSERT', 10, 'PersonID:20 (Farhan Sheikh) | Role:Suspect | CrimeID:10 Robbery', '2024-08-18 09:00:00'),
('Crime_Person', 'INSERT', 15, 'PersonID:19 (Renu Singh) | Role:Suspect | CrimeID:15 Kidnapping', '2024-11-10 10:00:00'),
('Crime_Person', 'UPDATE', 3,  'PersonID:8 (Subhas Mondal) | Role: Witness → Suspect | New evidence', '2024-03-20 11:00:00'),
-- DELETE events (corrections)
('Crime', 'DELETE', 99, 'Deleted test entry: Vandalism 2023-12-31 | Entry added by mistake during system testing', '2024-01-02 11:00:00'),
('Case_File', 'DELETE', 98, 'Deleted duplicate case for CrimeID:3 | Trigger had auto-created a second case', '2024-03-15 14:00:00'),
('FIR', 'DELETE', 97, 'Deleted duplicate FIR for CrimeID:4 | Filed twice in error by complainant', '2024-04-20 10:00:00');

-- ============================================================
-- ALL TRIGGERS (created AFTER seed data)
-- ============================================================

-- Crime INSERT audit
DELIMITER //
CREATE TRIGGER audit_crime_insert
    AFTER INSERT ON Crime FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Crime', 'INSERT', NEW.crime_id,
        CONCAT('Type:', NEW.crime_type, ' | Date:', NEW.date, ' | Status:', NEW.status));
END //
DELIMITER ;

-- Crime UPDATE audit
DELIMITER //
CREATE TRIGGER audit_crime_update
    AFTER UPDATE ON Crime FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Crime', 'UPDATE', NEW.crime_id,
        CONCAT('Status: ', OLD.status, ' → ', NEW.status,
               ' | Type: ', NEW.crime_type));
END //
DELIMITER ;

-- Crime DELETE audit
DELIMITER //
CREATE TRIGGER audit_crime_delete
    AFTER DELETE ON Crime FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Crime', 'DELETE', OLD.crime_id,
        CONCAT('Deleted: ', OLD.crime_type, ' on ', OLD.date));
END //
DELIMITER ;

-- Case_File INSERT audit
DELIMITER //
CREATE TRIGGER audit_case_insert
    AFTER INSERT ON Case_File FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Case_File', 'INSERT', NEW.case_id,
        CONCAT('CrimeID:', NEW.crime_id, ' | Officer:', NEW.lead_officer_id,
               ' | Status:', NEW.case_status));
END //
DELIMITER ;

-- Case_File UPDATE audit
DELIMITER //
CREATE TRIGGER audit_case_update
    AFTER UPDATE ON Case_File FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Case_File', 'UPDATE', NEW.case_id,
        CONCAT('Status: ', OLD.case_status, ' → ', NEW.case_status));
END //
DELIMITER ;

-- Case_File DELETE audit
DELIMITER //
CREATE TRIGGER audit_case_delete
    AFTER DELETE ON Case_File FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Case_File', 'DELETE', OLD.case_id,
        CONCAT('Deleted: CrimeID:', OLD.crime_id, ' | Status:', OLD.case_status));
END //
DELIMITER ;

-- FIR INSERT audit
DELIMITER //
CREATE TRIGGER audit_fir_insert
    AFTER INSERT ON FIR FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('FIR', 'INSERT', NEW.fir_id,
        CONCAT('CrimeID:', NEW.crime_id, ' | FiledBy:', NEW.filed_by,
               ' | Date:', NEW.filing_date));
END //
DELIMITER ;

-- FIR UPDATE audit
DELIMITER //
CREATE TRIGGER audit_fir_update
    AFTER UPDATE ON FIR FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('FIR', 'UPDATE', NEW.fir_id,
        CONCAT('CrimeID:', NEW.crime_id, ' | FiledBy:', NEW.filed_by,
               ' | Date:', NEW.filing_date));
END //
DELIMITER ;

-- FIR DELETE audit
DELIMITER //
CREATE TRIGGER audit_fir_delete
    AFTER DELETE ON FIR FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('FIR', 'DELETE', OLD.fir_id,
        CONCAT('Deleted: CrimeID:', OLD.crime_id, ' | Date:', OLD.filing_date));
END //
DELIMITER ;

-- Evidence INSERT audit
DELIMITER //
CREATE TRIGGER audit_evidence_insert
    AFTER INSERT ON Evidence FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Evidence', 'INSERT', NEW.evidence_id,
        CONCAT('Type:', NEW.evidence_type, ' | CaseID:', NEW.case_id));
END //
DELIMITER ;

-- Evidence UPDATE audit
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

-- Evidence DELETE audit
DELIMITER //
CREATE TRIGGER audit_evidence_delete
    AFTER DELETE ON Evidence FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Evidence', 'DELETE', OLD.evidence_id,
        CONCAT('Deleted: ', OLD.evidence_type, ' | CaseID:', OLD.case_id));
END //
DELIMITER ;

-- Court_Case INSERT audit + auto-close case
DELIMITER //
CREATE TRIGGER after_court_verdict_insert
    AFTER INSERT ON Court_Case FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Court_Case', 'INSERT', NEW.court_case_id,
        CONCAT('CaseID:', NEW.case_id, ' | Court:', NEW.court_name,
               ' | Verdict:', NEW.verdict, ' | Hearing:', NEW.hearing_date));
    IF NEW.verdict IN ('Guilty', 'Acquitted', 'Dismissed') THEN
        UPDATE Case_File
        SET case_status = 'Closed',
            end_date    = COALESCE(NEW.hearing_date, CURDATE())
        WHERE case_id = NEW.case_id AND case_status != 'Closed';
    END IF;
END //
DELIMITER ;

-- Court_Case UPDATE audit + auto-close case
DELIMITER //
CREATE TRIGGER after_court_verdict_update
    AFTER UPDATE ON Court_Case FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Court_Case', 'UPDATE', NEW.court_case_id,
        CONCAT('Verdict: ', OLD.verdict, ' → ', NEW.verdict,
               ' | Court: ', NEW.court_name));
    IF NEW.verdict IN ('Guilty', 'Acquitted', 'Dismissed')
       AND OLD.verdict != NEW.verdict THEN
        UPDATE Case_File
        SET case_status = 'Closed',
            end_date    = COALESCE(NEW.hearing_date, CURDATE())
        WHERE case_id = NEW.case_id AND case_status != 'Closed';
    END IF;
END //
DELIMITER ;

-- Court_Case DELETE audit
DELIMITER //
CREATE TRIGGER audit_court_delete
    AFTER DELETE ON Court_Case FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Court_Case', 'DELETE', OLD.court_case_id,
        CONCAT('Deleted: Case#', OLD.case_id, ' Court:', OLD.court_name,
               ' Verdict:', OLD.verdict));
END //
DELIMITER ;

-- Crime_Person INSERT audit
DELIMITER //
CREATE TRIGGER audit_crime_person_insert
    AFTER INSERT ON Crime_Person FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Crime_Person', 'INSERT', NEW.crime_id,
        CONCAT('PersonID:', NEW.person_id, ' | Role:', NEW.role));
END //
DELIMITER ;

-- Crime_Person UPDATE audit
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

-- Crime_Person DELETE audit
DELIMITER //
CREATE TRIGGER audit_crime_person_delete
    AFTER DELETE ON Crime_Person FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (table_name, operation, record_id, details)
    VALUES ('Crime_Person', 'DELETE', OLD.crime_id,
        CONCAT('PersonID:', OLD.person_id, ' | Role:', OLD.role, ' removed'));
END //
DELIMITER ;
