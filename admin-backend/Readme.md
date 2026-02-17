# ISL-Admin Backend Readme

## Objective

## Technology Stack

- **Programming Language**: Python 3.10+
- **Web Framework**: FastAPI
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy



## Installation Steps

### Set up locally for development 

We follow a fork-and-merge Git workflow:
- Fork the repo: [vachan-admin Backend Repository](https://github.com/Bridgeconn/isl-manzil-web.git) to your Github account.


#### Clone the Git Repository

```bash
git clone https://github.com/Bridgeconn/isl-manzil-web.git
```

#### Set up Virtual Environment

Go to app's backend folder

```bash 
cd isl-manzil-web/admin-backend
```

```bash 

python3 -m venv env
source env/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

**Note**: If there is any issue while installing `psycopg2`, try installing `psycopg2-binary` instead.

#### Set up PostgreSQL Database

**Prerequisite**: PostgreSQL (refer to the [PostgreSQL website](https://www.postgresql.org/download/linux/ubuntu/) for installation and setup).

1. Log in to `psql` (command-line interface for PostgreSQL) using your username and password:

   ```bash
   sudo -i -u postgres
   psql
   ```

2. Create a new database with your desired name:

   ```sql
   CREATE DATABASE db_name;
   ```

3. Exit from `psql`:

   ```bash
   \q
   ```

4. Exit from the PostgreSQL terminal:

   ```bash
   exit
   ```

#### Set up Environmental Variables

Go to the home directory and open the `.bashrc` file:

```bash
cd
gedit .bashrc
```

Edit the following contents appropriately and paste them into the `.bashrc` file:

```bash
export ISL_ADMIN_POSTGRES_HOST="localhost"
export ISL_ADMIN_POSTGRES_PORT="5432"
export ISL_ADMIN_POSTGRES_USER="<db_user>"
export ISL_ADMIN_POSTGRES_PASSWORD="<db_password>"
export ISL_ADMIN_POSTGRES_DATABASE="<db_name>"
```


After editing the `.bashrc` file, refresh it by running:

```bash
. ~/.bashrc
```

or:

```bash
source ~/.bashrc
```

Alternatively, log out and log back in to refresh the `.bashrc` file.



#### Run the App


From the `cd isl-manzil-web/admin-backend/app` folder:



Run the application:

   ```bash
   uvicorn main:app --reload
   ```

If all goes well, you should see the following message in the terminal:

```bash
INFO:     Started server process [17599]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

To run the app on another port, use the `--port` option. To enable debug mode, use the `--debug` option:

```bash
uvicorn main:app --port=7000 --debug
```

## For Running the App using docker

Alright — I’ve cleaned this up and upgraded it into a proper, production-ready README your team can actually follow without guessing things.
This version reflects your **current docker-compose (with SuperTokens + external isl-network + healthchecks)** and includes all required env variables.

You can replace your existing README section with this 👇

---

# ISL Admin Backend – Docker Setup Guide

This guide explains how to run the **ISL Admin Backend** using Docker.

The backend stack includes:

* FastAPI Application (`isl_admin_app`)
* PostgreSQL (Application DB)
* SuperTokens Core
* PostgreSQL (SuperTokens DB)

All services communicate over a shared Docker network: `isl-network`.

---

# Architecture Overview

### Services

### 1.isl-admin-db

PostgreSQL database for the main application.

* Image: `postgres:15.2`
* Internal Port: `5432`
* Persistent Volume: `isl-admin-db-vol`
* Network: `isl-network`

---

### 2. supertokens-db

PostgreSQL database used by SuperTokens.

* Image: `postgres:15.2`
* Internal Port: `5432`
* Persistent Volume: `supertokens-db-vol`
* Network: `isl-network`

---

### 3. supertokens_core

SuperTokens authentication core service.

* Image: `registry.supertokens.io/supertokens/supertokens-postgresql`
* Port: `3567:3567`
* Depends on: `supertokens-db`
* Network: `isl-network`

---

### 4. isl_admin_app

Main FastAPI backend application.

* Built from: `../../admin-backend`
* Port: `8000:8000`
* Depends on:

  * `isl-admin-db`
  * `supertokens_core`
* Network: `isl-network`

---

# Prerequisites

Make sure the following are installed:

* Docker (20.10+)
* Docker Compose (v2+)
* Terminal access

Verify:

```bash
docker --version
docker compose version
```

---

# Step 0: Create Docker Network (IMPORTANT)

This project uses an **external Docker network**.

Check if it exists:

```bash
docker network ls
```

If `isl-network` does not exist, create it:

```bash
docker network create isl-network
```

This only needs to be done once.

---

# Step 1: Create .env File

Navigate to:

```
isl-manzil-web/docker/docker_backend/
```

Create a file named:

```
.env
```

Add the following required variables:

```env
# =========================
# ISL ADMIN DATABASE
# =========================
ISL_ADMIN_POSTGRES_PORT=5432
ISL_ADMIN_POSTGRES_USER=postgres
ISL_ADMIN_POSTGRES_PASSWORD=postgres
ISL_ADMIN_POSTGRES_DATABASE=isl_admin_db

# =========================
# SUPERTOKENS DATABASE
# =========================
SUPERTOKENS_DB_PASSWORD=postgres

# =========================
# SUPERTOKENS CONFIG
# =========================
SUPERTOKENS_API_KEY=your_supertokens_api_key
SUPERTOKENS_API_DOMAIN=http://localhost:8000
SUPERTOKENS_WEBSITE_DOMAIN=http://localhost:5173
SUPERTOKENS_ANTI_CSRF=false
SUPERTOKENS_COOKIE_DOMAIN=localhost
SUPERTOKENS_COOKIE_SECURE=false
SUPERTOKENS_COOKIE_SAME_SITE=lax

# =========================
# SMTP CONFIG
# =========================
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_NAME=ISL Admin
SMTP_EMAIL=test@example.com
SMTP_PASSWORD=password
SMTP_SECURE=false

# =========================
# OTHER
# =========================
VALID_API_KEYS=your_valid_api_key
LOG_LEVEL=INFO
```

All these variables are required for proper startup.

---

# Step 2: Build and Start Services

From:

```
isl-manzil-web/docker/docker_backend/
```

Run:

```bash
docker compose up --build
```

Or in detached mode:

```bash
docker compose up --build -d
```

This will:

* Build backend image
* Start both PostgreSQL databases
* Start SuperTokens
* Start FastAPI app

---

# Step 3: Verify Services

Check running containers:

```bash
docker ps
```

You should see:

```
isl_admin_app
isl_admin_db
supertokens_core
supertokens_db
```

---

# Step 4: Access Application

Backend API:

```
http://localhost:8000
```

Swagger Docs:

```
http://localhost:8000/docs
```

SuperTokens Core:

```
http://localhost:3567/hello
```

---

# Volumes

* `isl-admin-db-vol` → Application DB data
* `supertokens-db-vol` → SuperTokens DB data
* `isl-logs-vol` → Application logs

To remove volumes (WARNING: deletes DB data):

```bash
docker compose down -v
```

---

# Useful Commands

Stop services:

```bash
docker compose down
```

Restart services:

```bash
docker compose restart
```

View logs:

```bash
docker logs isl_admin_app
docker logs supertokens_core
```

Rebuild after code changes:

```bash
docker compose up --build
```

---

# Network Information

All services run on:

```
isl-network
```

To verify:

```bash
docker inspect isl_admin_app | grep NetworkMode
```

Expected:

```
"NetworkMode": "isl-network"
```

---

### Backend cannot connect to DB

Check DB health:

```bash
docker ps
```

`isl_admin_db` must be healthy.

---

### Frontend cannot connect to backend

Make sure:

```
VITE_FASTAPI_BASE_URL=http://isl_admin_app:8000
```

And both containers are on `isl-network`.

---

Backend URL:

```
http://localhost:8000
```
