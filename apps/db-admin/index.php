<?php
/**
 * Basic Auth wrapper for Adminer.
 *
 * PHP built-in server (used by the adminer Docker image) does not populate
 * $_SERVER['PHP_AUTH_USER'] / $_SERVER['PHP_AUTH_PW'] — it passes the raw
 * Authorization header as HTTP_AUTHORIZATION instead.  We parse it here.
 *
 * Required env vars:
 *   ADMINER_AUTH_USER  — username (default: "admin")
 *   ADMINER_AUTH_PASS  — password (must be set; empty string allows blank password)
 */

$expectedUser = getenv('ADMINER_AUTH_USER') !== false ? getenv('ADMINER_AUTH_USER') : 'admin';
$expectedPass = getenv('ADMINER_AUTH_PASS') !== false ? getenv('ADMINER_AUTH_PASS') : '';

$authed = false;
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

if (preg_match('/^Basic\s+(.+)$/i', $authHeader, $matches)) {
    $decoded = base64_decode($matches[1]);
    [$user, $pass] = array_pad(explode(':', $decoded, 2), 2, '');
    if (hash_equals($expectedUser, $user) && hash_equals($expectedPass, $pass)) {
        $authed = true;
    }
}

if (!$authed) {
    header('WWW-Authenticate: Basic realm="Sphere DB Admin"');
    http_response_code(401);
    echo "401 Unauthorized — valid credentials required.";
    exit;
}

require '/var/www/html/adminer.php';
