# vachan-admin Backend Readme

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

## Services Overview

### Main Application Stack

1. **isl-admin-db** - PostgreSQL database for the main application

   - Image: `postgres:15.2`
   - Internal port: `5432`
   - Database: Configured via environment variables

2. **isl_admin_app** - Main FastAPI backend application
   - Built from: `../../admin-backend` directory
   - Port: `8000:8000`
   - Depends on: `isl-admin-db`

## Prerequisites

Before you begin, make sure you have the following installed on your system:

- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or higher)
- A terminal/command prompt
- A text editor (for creating the .env file)

## Quick Setup

### Step 1: Create Environment File

1. Navigate to the directory containing your `docker-compose.yml` file
2. Create a new file named `.env` in the same directory
3. Add the following configuration to the `.env` file:

```env

#----ISL Admin DB Config----
ISL_ADMIN_POSTGRES_PORT=5432
ISL_ADMIN_POSTGRES_USER=user
ISL_ADMIN_POSTGRES_PASSWORD=secret
ISL_ADMIN_POSTGRES_DATABASE=db

LOG_LEVEL=<LOG_LEVEL>

SUPERTOKENS_CONNECTION_URI=http://localhost:3567
SUPERTOKENS_API_KEY=Akjnv3iunvsoi8=-sackjij3ncisds
API_DOMAIN=http://localhost:8000
WEBSITE_DOMAIN=http://localhost:5173
ENV=development
VALID_API_KEYS=your api key

```

## Network & Volumes

- **Network**: `va-network` - Internal network for service communication
- **Volumes**:
  - `isl-admin-db-vol` - Persistent storage for main database
  - `isl-logs-vol` - Application logs storage

### Step 2: Build and Start the Application

Open your terminal/command prompt and run this from the docker/docker_backend folder:

```bash
docker compose up --build
```


This command will:

- Build all the necessary Docker images
- Start all services (databases and the main application)
- Show logs from all running containers

**Note:** The first build may take several minutes as Docker downloads and builds all the required images.

### Step 3: Verify Services are Running

Once all services are up and running, verify they're working correctly:

1. **Check Main Application**: Go to `http://localhost:8000`
   - You should see the FastAPI application running
   - Go to `http://localhost:8000/docs` to see the API documentation (Swagger UI)

