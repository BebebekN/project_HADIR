#!/bin/sh
set -e

PORT_VALUE="${PORT:-80}"
if [ "$PORT_VALUE" != "80" ]; then
    sed -ri -e "s/^Listen 80$/Listen ${PORT_VALUE}/g" /etc/apache2/ports.conf
    sed -ri -e "s/<VirtualHost \*:80>/<VirtualHost *:${PORT_VALUE}>/g" /etc/apache2/sites-available/000-default.conf
fi

mkdir -p /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/framework/cache/data \
         /var/www/html/storage/logs
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Sync schema safely on shared Neon Postgres without dropping existing Node API data
php artisan migrate --force || echo "Warning: migration check deferred"

exec apache2-foreground
