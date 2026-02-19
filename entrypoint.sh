#!/bin/bash

# Function to run a command and check for errors
run_command() {
    echo "Running: $1"
    $1 2>&1 | tee /dev/stderr
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        echo "Error: Command '$1' failed"
        exit 1
    fi
}


echo "Collecting static files"
run_command "python manage.py collectstatic --no-input"


echo "Actual migrations"
run_command "python manage.py makemigrations --no-input"
run_command "python manage.py migrate --no-input"


echo "Create super user"
run_command "python manage.py create_super_user"

# echo "Load the village sample data"
# run_command "python manage.py loaddata default.yaml"
# run_command "python manage.py loaddata cells.yaml"


echo "Starting celery worker... & Starting main process... entrypoint loaded with new config "

celery -A main worker --loglevel=info &

exec "$@"