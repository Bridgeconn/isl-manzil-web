# ISL Admin Frontend – Docker Setup Guide

This guide explains how to run the ISL Admin Frontend using Docker.

---

## Prerequisites

Make sure the following are installed:

* Docker
* Docker Compose (v2)

Check versions:

```bash
docker --version
docker compose version
```

---

## Environment Variables

Create a `.env` file inside:

```
docker/docker_frontend/.env
```

Add the following variables:

```env
VITE_FASTAPI_BASE_URL=http://localhost:8000
VITE_SUPERTOKENS_API_DOMAIN=http://localhost:8000
VITE_SUPERTOKENS_WEBSITE_DOMAIN=http://localhost:5173
```

## Run Frontend Using Docker

Navigate to frontend docker folder:

```bash
cd docker/docker_frontend
```

Build and start the container:

```bash
docker compose up -d --build
```

---

## Access the Frontend

Open browser:

```
http://localhost:5173
```

---

## Stop the Frontend

```bash
docker compose down
```

---

## View Logs

```bash
docker logs isl-admin-frontend
```

---

## Notes

* Make sure backend is running on port `8000`
* Make sure Docker network `isl-network` exists

Create network if needed:

```bash
docker network create isl-network
```

---

Frontend is now ready to use.
