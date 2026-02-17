Here is a clean, professional **README.md for your frontend Docker setup** that your team can follow easily.

---

# ISL Admin Frontend – Docker Setup Guide

This guide explains how to run the **ISL Admin Frontend** using Docker.

The frontend connects to:

* FastAPI Backend
* SuperTokens Authentication
* Shared Docker network (`isl-network`)

---

# Prerequisites

Make sure the following are installed:

* Docker
* Docker Compose
* Backend services already running (FastAPI, SuperTokens, Postgres)

Verify Docker is installed:

```bash
docker --version
docker compose --version
```

---

# Project Structure

Expected structure:

```
isl-manzil-web/
│
├── admin-ui/
│
├── docker/
│   ├── docker_backend/
│   └── docker_frontend/
│       ├── docker-compose.yml
│       └── Dockerfile
```

---

# Step 1: Create Docker Network (Required)

The frontend connects to the shared network used by backend services.

Check if network exists:

```bash
docker network ls
```

If `isl-network` does not exist, create it:

```bash
docker network create isl-network
```

This step only needs to be done once.

---

# Step 2: Create .env file

Inside:

```
isl-manzil-web/docker/docker_frontend/
```

Create a file named:

```
.env
```

Add the following:

```env
VITE_FASTAPI_BASE_URL=http://isl_admin_app:8000

VITE_SUPERTOKENS_API_DOMAIN=http://localhost:8000

VITE_SUPERTOKENS_WEBSITE_DOMAIN=http://localhost:5173
```

Explanation:

* `isl_admin_app` → backend container name
* `localhost:5173` → frontend browser URL
* `localhost:8000` → backend exposed port

---

# Step 3: Build and Run Frontend Container

Navigate to frontend docker folder:

```bash
cd isl-manzil-web/docker/docker_frontend
```

Run:

```bash
docker compose up --build -d
```

This will:

* Build frontend image
* Start container
* Connect to backend
* Connect to SuperTokens

---

# Step 4: Verify Container is Running

Run:

```bash
docker ps
```

You should see:

```
isl-admin-frontend
```

---

# Step 5: Access Application

Open browser:

```
http://localhost:5173
```

Frontend should load successfully.

---

# Container Details

Container Name:

```
isl-admin-frontend
```

Port Mapping:

```
5173 → 5173
```

Network:

```
isl-network
```

---

# How Frontend Communicates with Backend

Inside Docker network:

```
Frontend → http://isl_admin_app:8000
```

Do NOT use localhost inside Docker.

---

# Useful Commands

Stop container:

```bash
docker compose down
```

Restart container:

```bash
docker compose restart
```

View logs:

```bash
docker logs isl-admin-frontend
```

Rebuild container:

```bash
docker compose up --build
```

---

# Troubleshooting

If frontend cannot connect to backend:

Verify both are on same network:

```bash
docker inspect isl-admin-frontend | grep NetworkMode
docker inspect isl_admin_app | grep NetworkMode
```

Both should show:

```
isl-network
```

---

# Backend Requirement

Make sure backend is running before starting frontend.

Backend container should be:

```
isl_admin_app
```

Access URL:

```
http://localhost:5173
```

---

