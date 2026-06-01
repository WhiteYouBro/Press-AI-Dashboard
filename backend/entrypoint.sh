#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."
while ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
  sleep 1
done

if [ "$1" = "gunicorn" ]; then
  echo "Running migrations..."
  python manage.py migrate --noinput

  echo "Collecting static..."
  python manage.py collectstatic --noinput

  echo "Creating superuser if not exists..."
  python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
username = '$DJANGO_SUPERUSER_USERNAME'
email = '$DJANGO_SUPERUSER_EMAIL'
password = '$DJANGO_SUPERUSER_PASSWORD'
if username and password and not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, email, password)
    print('Superuser created')
"

  echo "Scheduling Celery Beat tasks..."
  python manage.py shell -c "from articles.tasks import schedule_pipeline; schedule_pipeline.delay()"
fi

echo "Starting command..."
exec "$@"
