FROM php:7.4-apache

# Install PDO MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Copy custom apache config if needed (optional)
# COPY apache-config.conf /etc/apache2/sites-enabled/000-default.conf

EXPOSE 80
