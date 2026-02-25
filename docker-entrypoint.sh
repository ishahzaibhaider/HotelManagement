#!/bin/bash
set -e

# Wait for MySQL to be ready (belt-and-suspenders beyond healthcheck)
echo "Waiting for database connection..."
for i in $(seq 1 30); do
    if php -r "try { new PDO('mysql:host=${DB_SERVER};port=3306', '${DB_USER}', '${DB_PASSWORD}'); echo 'ok'; } catch(Exception \$e) { exit(1); }" 2>/dev/null; then
        echo "Database is ready."
        break
    fi
    echo "Waiting for database... ($i/30)"
    sleep 2
done

# Check if QloApps is already installed
if [ ! -f /var/www/html/config/settings.inc.php ]; then
    echo "============================================"
    echo "  QloApps not installed. Running installer..."
    echo "============================================"

    # Run CLI installer
    php /var/www/html/install/index_cli.php \
        --step=all \
        --language=en \
        --timezone=UTC \
        --domain="${SHOP_DOMAIN:-localhost}" \
        --base_uri=/ \
        --db_server="${DB_SERVER:-db}" \
        --db_user="${DB_USER:-qloapps}" \
        --db_password="${DB_PASSWORD:-qloapps_secret}" \
        --db_name="${DB_NAME:-qloapps}" \
        --db_create=1 \
        --db_clear=1 \
        --prefix="${DB_PREFIX:-qlo_}" \
        --engine=InnoDB \
        --name="${SHOP_NAME:-My Hotel}" \
        --country="${SHOP_COUNTRY:-us}" \
        --firstname="${ADMIN_FIRSTNAME:-Admin}" \
        --lastname="${ADMIN_LASTNAME:-User}" \
        --password="${ADMIN_PASSWORD:-Admin@123}" \
        --email="${ADMIN_EMAIL:-admin@example.com}" \
        --newsletter=0

    if [ $? -eq 0 ]; then
        echo "============================================"
        echo "  QloApps installed successfully!"
        echo "============================================"

        # Protect install directory (rename instead of delete for safety)
        if [ -d /var/www/html/install ]; then
            mv /var/www/html/install /var/www/html/install.bak
            echo "Install directory renamed to install.bak"
        fi

        # Apply post-install domain and settings fixes
        if [ -n "${SHOP_DOMAIN}" ] && [ "${SHOP_DOMAIN}" != "localhost" ]; then
            echo "Applying domain settings: ${SHOP_DOMAIN}"
            php -r "
                \$db = new PDO('mysql:host=${DB_SERVER};dbname=${DB_NAME}', '${DB_USER}', '${DB_PASSWORD}');
                \$prefix = '${DB_PREFIX:-qlo_}';
                \$domain = '${SHOP_DOMAIN}';
                \$db->exec(\"UPDATE \${prefix}shop_url SET domain='\$domain', domain_ssl='\$domain' WHERE main=1\");
                \$db->exec(\"UPDATE \${prefix}configuration SET value='\$domain' WHERE name IN ('PS_SHOP_DOMAIN', 'PS_SHOP_DOMAIN_SSL')\");
                \$db->exec(\"UPDATE \${prefix}configuration SET value='0' WHERE name='PS_DASHBOARD_SIMULATION'\");
                echo 'Domain and settings updated successfully.';
            "
        fi
    else
        echo "============================================"
        echo "  ERROR: QloApps installation failed!"
        echo "============================================"
    fi
else
    echo "QloApps is already installed. Skipping installation."

    # Ensure install directory is protected
    if [ -d /var/www/html/install ]; then
        mv /var/www/html/install /var/www/html/install.bak
        echo "Install directory renamed to install.bak"
    fi
fi

# Rename admin folder for security if ADMIN_FOLDER is set
if [ -n "${ADMIN_FOLDER}" ] && [ -d /var/www/html/admin ] && [ ! -d /var/www/html/${ADMIN_FOLDER} ]; then
    mv /var/www/html/admin /var/www/html/${ADMIN_FOLDER}
    echo "Admin folder renamed to ${ADMIN_FOLDER}"
fi

# Fix permissions after any changes
chown -R www-data:www-data /var/www/html/config /var/www/html/cache /var/www/html/log /var/www/html/img /var/www/html/upload /var/www/html/download

echo "Starting Apache..."
exec "$@"
