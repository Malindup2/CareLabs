# CareLabs - Smart Healthcare Platform

> AI-Enabled Smart Healthcare Appointment & Telemedicine Platform built with a Microservices backend and a Next.js frontend.

[![Java](https://img.shields.io/badge/Java-17-blue)](#)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.3-brightgreen)](#)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue)](#)
[![Status](https://img.shields.io/badge/Status-95%25_Completed-success)](#)
[![License](https://img.shields.io/badge/License-Academic-lightgrey)](#license)


---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [API Overview](#api-overview)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

CareLabs is a full-stack healthcare platform that enables:

- **Patients** to register, book appointments, upload medical reports, and pay online
- **Doctors** to manage profiles, set availability, and issue digital prescriptions
- **Admins** to verify doctors and manage platform users
- **AI-powered symptom checking** to recommend appropriate specialists
- **Telemedicine** via integrated video SDK
- **Real-time notifications** via email and SMS

---

## Architecture

```
                    +----------------------+
                    |     Frontend App     |
                    | (Next.js + Tailwind) |
                    +----------+-----------+
                               |
                    +----------v-----------+
                    |      API Gateway     |
                    |      (Port: 8080)    |
                    +----------+-----------+
                               |
     +----------+----------+---+---+----------+----------+----------+
     |          |          |       |          |          |          |
+----v-----++---v----++-----v----++----v----++----v---++---v------++--v----+
|  Auth    ||Patient ||  Doctor  ||Appoint. ||Notif.  || Payment  ||  AI   |
| Service  ||Service ||  Service || Service ||Service || Service  ||Service|
|  :8081   || :8082  ||  :8083   ||  :8084  || :8086  ||  :8087   || :8088 |
+----------++--------++----------++---------++--------++----------++-------+
     |           |          |          |
+----v-----------v----------v----------v-------------------------------------+
|                          PostgreSQL Databases                              |
|  carelabs_auth | carelabs_patients | carelabs_doctors                     |
|  carelabs_appointments | carelabs_payments                                |
+----------------------------------------------------------------------------+
```

---

## Tech Stack

| Layer            | Technology                                         |
|------------------|----------------------------------------------------|
| Frontend         | Next.js 15, TypeScript, Tailwind CSS               |
| Backend          | Java 17, Spring Boot 3.4.3                         |
| API Gateway      | Spring Cloud Gateway 2024.0.1                      |
| Database         | PostgreSQL 14+ (one isolated DB per service)       |
| Security         | Spring Security, JWT                               |
| Build Tool       | Maven                                              |
| Containerization | Docker, Kubernetes                                 |
| Notifications    | Spring Mail (SMTP), SMS API                        |
| Payments         | PayHere / Stripe (Sandbox)                         |
| Telemedicine     | Jitsi Meet / Agora / Twilio (Frontend SDK)         |
| AI               | Google Gemini API                                  |

---

## Project Structure

```
CareLabs/
├── backend/                    # Spring Boot microservices
│   ├── api-gateway/            # Port 8080 — routes all requests
│   ├── auth-service/           # Port 8081 — JWT auth & role management
│   ├── patient-service/        # Port 8082 — patient profiles & reports
│   ├── doctor-service/         # Port 8083 — doctor profiles & availability
│   ├── appointments-service/   # Port 8084 — booking & scheduling
│   ├── notification-service/   # Port 8086 — email & SMS
│   ├── payment-service/        # Port 8087 — PayHere / Stripe
│   ├── ai-symptom-service/     # Port 8088 — Gemini AI symptom checker
│   └── README.md
└── frontend/                   # Next.js application
    ├── app/                    # App router pages & layouts
    ├── public/                 # Static assets
    └── README.md
```

---

## Prerequisites

| Tool             | Version |
|------------------|---------|
| Java JDK         | 17+     |
| Maven            | 3.8+    |
| Node.js          | 18+     |
| PostgreSQL       | 14+     |
| Docker & Compose | Latest  |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/malindup2/carelabs.git
cd carelabs
```

### 2. Launch Entire Platform (Automated - RECOMMENDED)

This is the fastest and most professional way to start the system. It handles all building and orchestration in one command.

```powershell
# Build all backend services and launch the full stack (Frontend + Backend + DBs)
.\start-all.ps1
```

> [!NOTE]
> The automated script requires **Docker Desktop** and **Maven** to be installed on your machine.
> All databases and messaging infrastructure will be started automatically.

---

### Alternative Manual Setup (Development Mode)

If you wish to run the services individually for focused development:

#### A. Backend Setup
1. **Create Databases**: See the SQL commands in `backend/README.md`.
2. **Configure Services**: Copy `application-example.yml` to `application.yml` in each service folder.
3. **Run Services**:
   ```bash
   cd backend/api-gateway && ./mvnw spring-boot:run
   # ... (start each microservice in separate terminals)
   ```

#### B. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`, connecting to the API Gateway at `http://localhost:8080`.

---

## Environment Configuration

**Backend:** Each service has an `application-example.yml` in `src/main/resources/`.
Copy it to `application.yml` and fill in your values. These files are git-ignored — never commit real credentials.

**Frontend:** Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

> `.env.local` is git-ignored by default in Next.js projects.

---

## API Overview

All requests route through the **API Gateway** at `http://localhost:8080`.

| Service       | Base Path           | Description                           |
|---------------|---------------------|---------------------------------------|
| Auth          | `/auth/**`          | Register, login, JWT, role management |
| Patients      | `/patients/**`      | Profiles, reports, prescriptions      |
| Doctors       | `/doctors/**`       | Profiles, availability, prescriptions |
| Appointments  | `/appointments/**`  | Booking, scheduling, telemedicine     |
| Notifications | `/notifications/**` | Email & SMS                           |
| Payments      | `/payments/**`      | Initiate, verify, refund              |
| AI            | `/ai/**`            | Symptom checker                       |

Full endpoint reference: [backend/README.md](./backend/README.md#-api-endpoints)

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit with conventional commits: `git commit -m "feat: add your feature"`
4. Push and open a Pull Request

---

## License

This project is developed as part of the **SLIIT SE Year 3 Semester 2 Distributed Systems** module.

---

*Built by the CareLabs team.*
