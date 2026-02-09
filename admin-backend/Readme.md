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
export ISL_POSTGRES_HOST="localhost"
export ISL_POSTGRES_PORT="5432"
export ISL_POSTGRES_USER="<db_user>"
export ISL_POSTGRES_PASSWORD="<db_password>"
export ISL_POSTGRES_DATABASE="<db_name>"
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
