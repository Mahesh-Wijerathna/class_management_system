FROM php:8.1-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    zip \
    unzip \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd mysqli pdo pdo_mysql

# Enable Apache modules
RUN a2enmod rewrite headers

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY src/ .

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Create .htaccess for URL rewriting
RUN echo 'RewriteEngine On' > .htaccess \
    && echo 'RewriteCond %{REQUEST_FILENAME} !-f' >> .htaccess \
    && echo 'RewriteCond %{REQUEST_FILENAME} !-d' >> .htaccess \
    && echo 'RewriteRule ^(.*)$ routes.php [QSA,L]' >> .htaccess

# Expose port 80
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"] 