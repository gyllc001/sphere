FROM adminer:4.8

# Copy Basic Auth wrapper — overrides Adminer's default index.php
# The wrapper validates HTTP Basic Auth credentials from env vars before
# forwarding to adminer.php. PHP built-in server passes the Authorization
# header as HTTP_AUTHORIZATION, so we parse it manually.
COPY index.php /var/www/html/index.php

EXPOSE 8080
