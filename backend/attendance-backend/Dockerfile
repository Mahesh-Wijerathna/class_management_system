FROM php:8.2-apache

RUN docker-php-ext-install pdo pdo_mysql
RUN a2enmod rewrite

COPY php.ini /usr/local/etc/php/
COPY src/ /var/www/html/

WORKDIR /var/www/html