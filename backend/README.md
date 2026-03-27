#  CareLabs - Smart Healthcare Platform (Backend)

 **AI-Enabled Smart Healthcare Appointment & Telemedicine Platform** built with Microservices Architecture using Spring Boot, Spring Cloud Gateway, PostgreSQL, and Docker.

---

##  Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Microservices](#microservices)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Environment Configuration](#environment-configuration)
- [Docker & Kubernetes](#docker--kubernetes)

---

##  Architecture Overview

```
                        ┌──────────────────┐
                        │   Frontend App   │
                        │  (React/Angular) │
                        └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │   API Gateway    │
                        │   (Port: 8080)   │
                        └────────┬─────────┘
                                 │
          ┌──────────┬───────────┼───────────┬──────────┬──────────┬──────────┐
          │          │           │           │          │          │          │
    ┌─────▼────┐ ┌───▼────┐ ┌───▼────┐ ┌────▼───┐ ┌───▼────┐ ┌──▼───────┐ ┌─▼─────┐
    │  Auth    │ │Patient │ │Doctor  │ │Appoint.│ │Notif.  │ │Payment   │ │  AI   │
    │ Service  │ │Service │ │Service │ │Service │ │Service │ │Service   │ │Service│
    │  :8081   │ │ :8082  │ │ :8083  │ │ :8084  │ │ :8086  │ │  :8087   │ │ :8088 │
    └──────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └──────────┘ └───────┘
          │          │           │           │
    ┌─────▼──────────▼───────────▼───────────▼─────┐
    │              PostgreSQL Databases             │
    └───────────────────────────────────────────────┘
```

---

##  Tech Stack

| Layer           | Technology                                |
|-----------------|-------------------------------------------|
| Backend         | Java 17, Spring Boot 3.4.3                |
| API Gateway     | Spring Cloud Gateway (2024.0.1)           |
| Database        | PostgreSQL                                |
| Security        | Spring Security, JWT                      |
| Build Tool      | Maven                                     |
| Containerization| Docker, Kubernetes                        |
| Notifications   | Spring Mail (SMTP), SMS API               |
| Payments        | PayHere / Stripe (Sandbox)                |
| Telemedicine    | Jitsi Meet / Agora / Twilio (Frontend SDK)|

---

##  Microservices

| Service                | Port   | Description                                              |
|------------------------|--------|----------------------------------------------------------|
| `api-gateway`          | `8080` | Routes all client requests to appropriate microservices  |
| `auth-service`         | `8081` | Authentication, JWT tokens, role management (Admin/Doctor/Patient) |
| `patient-service`      | `8082` | Patient registration, profiles, medical reports, history |
| `doctor-service`       | `8083` | Doctor profiles, availability, digital prescriptions     |
| `appointments-service` | `8084` | Appointment booking, modification, cancellation, tracking|
| `notification-service` | `8086` | Email and SMS notifications                              |
| `payment-service`      | `8087` | Payment processing via PayHere/Stripe                    |
| `ai-symptom-service`   | `8088` | AI-powered symptom checker (Optional Enhancement)        |

---

##  Getting Started

### Prerequisites

- Java 17 (JDK)
- Maven 3.8+
- PostgreSQL 14+
- Docker & Docker Compose (for containerized deployment)

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-repo/CareLabs.git
   cd CareLabs/backend
   ```

2. **Create PostgreSQL databases:**
   ```sql
   CREATE DATABASE carelabs_auth;
   CREATE DATABASE carelabs_patients;
   CREATE DATABASE carelabs_doctors;
   CREATE DATABASE carelabs_appointments;
   CREATE DATABASE carelabs_payments;
   ```

3. **Configure each service:**
   - Navigate to each service folder (e.g., `auth-service/src/main/resources/`)
   - Copy `application-example.yml` to `application.yml`
   - Update database credentials and other sensitive config values

4. **Run each service:**
   ```bash
   # Start the API Gateway first
   cd api-gateway && ./mvnw spring-boot:run

   # Then start each microservice (in separate terminals)
   cd auth-service && ./mvnw spring-boot:run
   cd patient-service && ./mvnw spring-boot:run
   cd doctor-service && ./mvnw spring-boot:run
   cd appointments && ./mvnw spring-boot:run
   cd notification-service && ./mvnw spring-boot:run
   cd payment-service && ./mvnw spring-boot:run
   ```

---

## API Endpoints

All requests go through the **API Gateway** at `http://localhost:8080`.

### Auth Service (/auth)

| Method | Endpoint | Description | Role |
|:---|:---|:---|:---|
| POST | `/auth/register` | Register a new user | Public |
| POST | `/auth/login` | Login and receive JWT | Public |
| POST | `/auth/refresh` | Refresh expired JWT | Any |
| GET | `/auth/me` | Get current user profile | Any |
| PUT | `/auth/change-password` | Change password | Any |
| GET | `/auth/admin/users` | List all users | Admin |
| PUT | `/auth/admin/users/{id}/role` | Update user role | Admin |
| DELETE | `/auth/admin/users/{id}` | Delete user account | Admin |

### Doctor Service (/doctors)

| Method | Endpoint | Description | Role |
|:---|:---|:---|:---|
| GET | `/doctors` | Browse all verified doctors | Public |
| GET | `/doctors/{id}` | Get public doctor details | Public |
| GET | `/doctors?specialty={specialty}` | Search doctors by specialty | Public |
| GET | `/doctors/me` | Get own doctor profile | Doctor |
| PUT | `/doctors/me` | Update doctor profile | Doctor |
| POST | `/doctors/documents` | Upload verification docs (Multipart) | Doctor |
| GET | `/doctors/documents` | View own documents | Doctor |
| DELETE | `/doctors/documents/{id}` | Delete document | Doctor |
| PUT | `/doctors/{id}/verify` | Verify doctor registration | Admin |
| POST | `/doctors/availability` | Set weekly availability template | Doctor |
| PUT | `/doctors/availability/{id}` | Update availability template | Doctor |
| DELETE | `/doctors/availability/{id}` | Remove availability template | Doctor |
| POST | `/doctors/leave` | Add a specific day off | Doctor |

### Patient Service (/patients)

| Method | Endpoint | Description | Role |
|:---|:---|:---|:---|
| GET | `/patients/me` | Get own profile | Patient |
| PUT | `/patients/me` | Update profile | Patient |
| POST | `/patients/reports` | Upload medical report (Multipart) | Patient |
| GET | `/patients/reports` | List uploaded reports | Patient |
| GET | `/patients/reports/{id}` | Download specific report | Patient |
| DELETE | `/patients/reports/{id}` | Delete a report | Patient |
| GET | `/patients/medical-history` | View AI symptoms & history | Patient |

### Appointment Service (/appointments)

*Handles Bookings, Clinical Data, and Chat*

| Method | Endpoint | Description | Role |
|:---|:---|:---|:---|
| POST | `/appointments` | Book a new appointment | Patient |
| GET | `/appointments` | List appointments (Contextual by JWT) | User |
| GET | `/appointments/{id}` | Get appointment details | User |
| PUT | `/appointments/{id}` | Reschedule appointment | Patient |
| DELETE | `/appointments/{id}` | Cancel appointment | Patient |
| PUT | `/appointments/{id}/status` | Update status (e.g., ACCEPTED) | Doctor |
| GET | `/appointments/available-slots` | Get open slots for a date & doctor | Public |
| GET | `/appointments/{id}/meeting-link` | Get Jitsi video URL | User |
| POST | `/appointments/{id}/review` | Submit post-consultation review | Patient |
| POST | `/appointments/{id}/notes` | Doctor saves clinical notes | Doctor |
| GET | `/appointments/{id}/notes` | Patient/Doctor views notes | User |
| POST | `/appointments/{id}/prescriptions` | Doctor issues prescription | Doctor |
| GET | `/appointments/prescriptions/{id}` | View specific prescription | User |
| GET | `/appointments/{id}/chat` | Get chat history for session | User |
| POST | `/appointments/{id}/chat` | Send message in session | User |

### Payment Service (/payments)

| Method | Endpoint | Description | Role |
|:---|:---|:---|:---|
| POST | `/payments/initiate` | Start PayHere/Stripe checkout | Patient |
| GET | `/payments/{id}` | Get payment details | Patient |
| GET | `/payments/appointment/{id}` | Get payment by appointment ID | Patient |
| GET | `/payments/history` | Get user's payment history | Patient |
| POST | `/payments/notify` | Webhook for gateway callback | External |
| GET | `/payments/verify/{orderId}` | Frontend polling check | Patient |
| POST | `/payments/refund/{id}` | Process a refund | Admin |
| GET | `/payments/admin/transactions` | List platform transactions | Admin |

### Notification Service (/notifications)

| Method | Endpoint | Description | Role |
|:---|:---|:---|:---|
| POST | `/notifications` | Internal trigger (Email/SMS) | Internal |
| GET | `/notifications` | Get user's notification history | Any |
| PUT | `/notifications/{id}/read` | Mark as read | Any |

### AI Symptom Checker Service (/ai)

| Method | Endpoint | Description | Role |
|:---|:---|:---|:---|
| POST | `/ai/symptom-check` | Submit symptoms & get prediction | Patient |



---

##  Environment Configuration

Each microservice has an `application-example.yml` file in its `src/main/resources/` directory. To configure:

1. Copy `application-example.yml` → `application.yml`
2. Update the placeholder values (DB credentials, API keys, etc.)

 **Important:** `application.yml` files are excluded from Git via `.gitignore` to protect sensitive credentials. Only `application-example.yml` files are version-controlled.

### Database per Service Pattern

Each microservice uses its own isolated PostgreSQL database:

| Service              | Database Name            |
|----------------------|--------------------------|
| `auth-service`       | `carelabs_auth`          |
| `patient-service`    | `carelabs_patients`      |
| `doctor-service`     | `carelabs_doctors`       |
| `appointments`       | `carelabs_appointments`  |
| `payment-service`    | `carelabs_payments`      |
| `notification-service` | *(No DB — uses SMTP/SMS APIs)* |

---

##  Docker & Kubernetes



```
# Future structure:
backend/
├── docker-compose.yml
├── api-gateway/Dockerfile
├── auth-service/Dockerfile
├── patient-service/Dockerfile
├── doctor-service/Dockerfile
├── appointments-service/Dockerfile
├── notification-service/Dockerfile
└── payment-service/Dockerfile
```

---
##  License

This project is developed as part of the **SLIIT SE Year 3 Semester 2 Distributed Systems** module.
