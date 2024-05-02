FROM httpd:2.4

COPY index.html /usr/local/apache2/htdocs/
COPY css/ /usr/local/apache2/htdocs/css/
COPY js/ /usr/local/apache2/htdocs/js/
COPY assets/ /usr/local/apache2/htdocs/assets/
COPY shaders/ /usr/local/apache2/htdocs/shaders/

EXPOSE 80