# Crime Management System

A full-stack web application for managing criminal investigations, built as a course project for **Introduction to Database Systems (CSD317)**.

**Team:** Ishanvi Singh · Anant Joshi · Akshat Bansal · Arpit Goel · Manasvi Sharma  
**Submitted to:** Prof. Sonia Khetarpaul  
**Institution:** Shiv Nadar Institution of Eminence

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Notifications | React Hot Toast |
| Backend | Node.js + Express |
| Database | MySQL 8.0 |
| DB Driver | mysql2/promise |

---

## Prerequisites

- Node.js v18 or higher
- MySQL 8.0 (Community Server)
- npm

---

## Setup Instructions

### 1. Database Setup

Open your MySQL client (Terminal, MySQL Workbench, etc.) and run:

```bash
mysql -u root -p < schema.sql
```

Or manually:

```sql
mysql -u root -p
-- then paste the contents of schema.sql
```

This will:
- Create the `crime_db` database
- Create all 11 tables with constraints
- Insert sample data (15 crimes, 10 officers, 8 stations, etc.)
- Create indexes, views, stored procedure, function, trigger, and cursor

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env and set your MySQL password
npm install
npm start
```

The backend will run on **http://localhost:5000**

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on **http://localhost:3000**

Vite proxies all `/api` requests to the backend, so no CORS issues.

---

## Environment Variables

Create `backend/.env` with:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=crime_db
PORT=5000
```

---

## Features

### Dashboard
- Stat cards: total crimes, open/closed cases, officers, stations, FIRs, evidence
- Pie chart: crime type distribution
- Bar chart: crimes per city
- Area chart: monthly crime trends
- Recent incidents feed

### Crime Records
- Add, view, edit, delete crimes
- Search by type or city
- Filter by status (Open / Closed / Under Investigation) and crime type
- Click View to see linked persons and case files

### Case Files
- Full CRUD for case files
- View assigned officers, evidence, and court proceedings per case
- Filter by case status

### FIRs
- File, edit, delete FIRs
- Click View to open full FIR in popup
- Linked to crime and person who filed it

### Evidence Locker
- Card-based layout with colour-coded evidence types
- Filter by type (CCTV, Weapon, DNA, Digital Evidence, etc.)
- Each card linked to a case file

### Court Cases
- Track court name, hearing date, verdict
- Filter by verdict (Pending / Guilty / Acquitted / Dismissed)

### Officers & Stations
- Card layouts for officers with designation, badge number, station
- Station cards showing officer count

### Persons
- Table with all persons in system
- View modal shows crime involvement with roles (Victim / Suspect / Witness)

### Locations
- Colour-coded grid of all locations used by crimes and stations

---

## API Endpoints

All endpoints follow standard REST: `GET /` (list), `GET /:id` (one), `POST /` (create), `PUT /:id` (update), `DELETE /:id` (delete)

| Resource | Path |
|---|---|
| Dashboard stats | `GET /api/dashboard/stats` |
| Dashboard charts | `GET /api/dashboard/crime-types` / `crimes-per-city` / `monthly-trends` / `recent-incidents` |
| Crimes | `/api/crimes` |
| Cases | `/api/cases` |
| FIRs | `/api/firs` |
| Evidence | `/api/evidence` |
| Court Cases | `/api/court-cases` |
| Officers | `/api/officers` |
| Stations | `/api/stations` |
| Persons | `/api/persons` |
| Locations | `/api/locations` |
| Crime-Person links | `/api/crime-persons` |
| Case-Officer links | `/api/case-officers` |

---

## Database Objects

| Object | Name | Description |
|---|---|---|
| Stored Procedure | `GetCaseDetails(case_id)` | Returns full case info + evidence |
| Stored Function | `GetCrimeCount(city)` | Returns crime count for a city |
| Trigger | `after_crime_insert` | Auto-creates Case_File on new crime |
| Cursor | `ListOpenCases()` | Iterates all open cases row-by-row |
| View | `vw_crime_summary` | Crimes joined with location |
| View | `vw_case_details` | Cases with officer and location info |
| View | `vw_fir_details` | FIRs with crime type and filer name |

---

## Project Structure

```
crime-mgmt/
├── schema.sql                  # Complete DB setup script
├── README.md
├── backend/
│   ├── server.js               # Express entry point
│   ├── db.js                   # mysql2 connection pool
│   ├── .env.example
│   ├── package.json
│   └── routes/
│       ├── dashboard.js
│       ├── crimes.js
│       ├── cases.js
│       ├── firs.js
│       ├── evidence.js
│       ├── courtCases.js
│       ├── officers.js
│       ├── stations.js
│       ├── persons.js
│       ├── locations.js
│       ├── crimePersons.js
│       └── caseOfficers.js
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api.js
        ├── utils.js
        ├── index.css
        ├── components/
        │   ├── Sidebar.jsx
        │   ├── Modal.jsx
        │   └── ConfirmDialog.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── Crimes.jsx
            ├── Cases.jsx
            ├── FIRs.jsx
            ├── Evidence.jsx
            ├── CourtCases.jsx
            ├── Officers.jsx
            ├── Stations.jsx
            ├── Persons.jsx
            └── Locations.jsx
```

---

## References

1. GitHub Repository — https://github.com/nwopes/DBMS-Project
2. MySQL 8.0 Docs — https://dev.mysql.com/doc/refman/8.0/en/
3. React Docs — https://react.dev/
4. Vite Docs — https://vitejs.dev/
5. Tailwind CSS Docs — https://tailwindcss.com/docs
6. Recharts Docs — https://recharts.org/en-US/
7. Express.js Docs — https://expressjs.com/
8. mysql2 npm package — https://github.com/sidorares/node-mysql2
9. Elmasri & Navathe, *Fundamentals of Database Systems*, 7th Ed., Pearson
