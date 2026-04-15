*******************************************************************************
CareLabs: AI-Enabled Smart Healthcare Appointment & Telemedicine Platform
SE3020 – Distributed Systems Assignment 1
Deployment & Operation Guide
*******************************************************************************

1. SYSTEM OVERVIEW
------------------
CareLabs is a cloud-native microservices platform built for telemedicine. It features:
- Core Services: Auth, Patient, Doctor, Appointments, Payments, Notifications, AI Symptom Checker.
- API Gateway: Unified entry point with JWT-based role enforcement.
- Frontend: Modern Next.js dashboard for Patients, Doctors, and Administrators.
- Communications: Real-time Chat, Jitsi-based Video, and SMTP Email notifications.
- Infrastructure: Dockerized services orchestrated by Kubernetes.

2. PREREQUISITES
----------------
Ensure the following tools are installed on the deployment machine:
- Java JDK 17
- Node.js 18+ & NPM
- PostgreSQL 15+
- Apache Kafka (Local or Confluent Cloud)
- Docker & Kubernetes (minikube or Docker Desktop)
- Maven 3.8+

3. DATABASE INITIALIZATION
--------------------------
1. Ensure PostgreSQL is running.
2. Execute the initialization script found at:
   /backend/init-dbs.sql
   
   Commands:
   psql -U postgres -f backend/init-dbs.sql

Note: Spring Boot will automatically create the tables (ddl-auto: update) on first run.

4. BACKEND DEPLOYMENT (LOCAL)
------------------------------
1. Navigate to the /backend directory.
2. Build all services:
   mvn clean install -DskipTests

3. Startup Sequence (Manual):
   Run each service JAR in the following order:
   a. Auth Service (Port 8081)
   b. API Gateway (Port 8080)
   c. Discovery/Remaining Services (Patient, Doctor, Appointment, Payment, Notification)

4. Environment Configuration:
   Update /backend/[service]/src/main/resources/application.yml with your:
   - Kafka bootstrap servers
   - SMTP (Mail) credentials
   - PayHere Sandbox credentials

5. FRONTEND DEPLOYMENT
----------------------
1. Navigate to the /frontend directory.
2. Install dependencies:
   npm install
3. Run in development mode:
   npm run dev
4. Access the portal at: http://localhost:3000

6. KUBERNETES ORCHESTRATION
---------------------------
To deploy the entire stack to a K8s cluster:
1. Navigate to /backend/k8s
2. Apply the manifests:
   kubectl apply -f configmap-secret.yaml
   kubectl apply -f .

7. DEFAULT CREDENTIALS (TESTING)
---------------------------------
Admin Identity:
- Email: admin@carelabs.com
- Password: adminpassword (or as registered)

8. PROJECT STRUCTURE
--------------------
/backend                - Spring Boot Microservices
/frontend               - Next.js Web Client
/backend/k8s            - Kubernetes Manifests
/backend/init-dbs.sql   - DB Initialization Script
/postman                - API Test Collections
/tracking               - Progress & Workflow Checklists

*******************************************************************************
Official Submission for SE3020 Distributed Systems
*******************************************************************************
