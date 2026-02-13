### Option 1: Run backend locally using Uvicorn

### Option 2: Run backend using Docker

### option 1: SuperTokens Core and its database must be running before starting the backend.
Navigate to the Docker backend directory:
cd docker/docker_backend
## Start SuperTokens Core and its database:

```docker compose up supertokens supertokens-db```
This will start:
SuperTokens Core on port 3567

SuperTokens Database inside Docker

Verify containers are running:

docker ps

Option 1: Run Backend Using Uvicorn

Navigate to backend directory:

```cd backend```
Activate virtual environment:
source venv/bin/activate
Run backend:
``` uvicorn main:app --reload ```

Backend will be available at:

http://localhost:8000


Ensure your .env file contains:
``` SUPERTOKENS_DB_PASSWORD=supertokens_dev_password_123 ```
``` LOG_LEVEL=INFO```

This allows the local backend to connect to SuperTokens running in Docker.

Option 2: Run Backend Using Docker

Navigate to Docker backend directory:

```cd docker/docker_backend```


Run all services including backend:

``` docker compose up ```


This will start:

FastAPI Backend

SuperTokens Core

SuperTokens Database

Backend will be available at:

http://localhost:8000
