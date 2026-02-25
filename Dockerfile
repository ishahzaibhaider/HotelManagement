FROM php:8.3-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libzip-dev \
    libxml2-dev \
    libicu-dev \
    libonig-dev \
    libcurl4-openssl-dev \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
    pdo_mysql \
    gd \
    curl \
    soap \
    zip \
    intl \
    mbstring \
    opcache

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Set Apache DocumentRoot and allow .htaccess overrides
RUN sed -i 's|/var/www/html|/var/www/html|g' /etc/apache2/sites-available/000-default.conf \
    && sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# PHP configuration for production
RUN { \
    echo 'memory_limit = 256M'; \
    echo 'upload_max_filesize = 16M'; \
    echo 'post_max_size = 20M'; \
    echo 'max_execution_time = 500'; \
    echo 'allow_url_fopen = On'; \
    echo 'file_uploads = On'; \
    echo 'display_errors = Off'; \
    echo 'log_errors = On'; \
    echo 'opcache.enable = 1'; \
    echo 'opcache.memory_consumption = 128'; \
    echo 'opcache.max_accelerated_files = 10000'; \
    } > /usr/local/etc/php/conf.d/qloapps.ini

# Copy application code
COPY . /var/www/html/

# Create writable directories and set permissions
RUN mkdir -p /var/www/html/cache/smarty/compile \
    /var/www/html/cache/smarty/cache \
    /var/www/html/cache/tcpdf \
    /var/www/html/cache/cachefs \
    /var/www/html/log \
    /var/www/html/upload \
    /var/www/html/download \
    && chown -R www-data:www-data /var/www/html \
    && find /var/www/html -type d -exec chmod 755 {} \; \
    && find /var/www/html -type f -exec chmod 644 {} \; \
    && chmod -R 775 /var/www/html/config \
    /var/www/html/cache \
    /var/www/html/log \
    /var/www/html/img \
    /var/www/html/upload \
    /var/www/html/download \
    /var/www/html/modules \
    /var/www/html/mails \
    /var/www/html/translations \
    /var/www/html/themes/hotel-reservation-theme/lang \
    /var/www/html/themes/hotel-reservation-theme/cache

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
