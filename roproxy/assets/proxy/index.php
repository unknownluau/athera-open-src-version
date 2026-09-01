<?php
// assets/proxy/index.php - RAW copy-paste proxy (no decompression)

header('Access-Control-Allow-Origin: *');

$url = $_GET['url'] ?? '';
if (empty($url)) {
    http_response_code(400);
    die('Missing ?url=');
}

// Roblox whitelist
$allowed = ['rbxcdn.com', 'roblox.com', 'api.roblox.com', 'assetgame.roblox.com'];
$ok = false;
foreach ($allowed as $d) {
    if (stripos($url, $d) !== false) {
        $ok = true;
        break;
    }
}
if (!$ok) {
    http_response_code(403);
    die('Domain not allowed');
}

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS      => 10,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_USERAGENT      => 'Roblox/WinInet',
    CURLOPT_ENCODING       => '',
    CURLOPT_HEADER         => true,
    CURLOPT_HTTPHEADER     => [
        'Accept: */*',
        'Referer: https://www.roblox.com/'
    ],
]);

$content = curl_exec($ch);
$info = curl_getinfo($ch);

if ($content === false) {
    http_response_code(502);
    die('Upstream error');
}

// Forward status
http_response_code($info['http_code'] ?? 200);

// Forward ALL headers from upstream (including Content-Encoding: gzip)
$header_size = $info['header_size'];
$headers_raw = substr($content, 0, $header_size);
$body = substr($content, $header_size);

// Parse and forward headers
// Replace your existing foreach header loop with this:
$header_lines = explode("\r\n", $headers_raw);
foreach ($header_lines as $line) {
    $line = trim($line);
    if (empty($line) || stripos($line, 'HTTP/') === 0) continue;

    // List of headers that trigger 502s in Cloudflare when proxied via PHP dev server
    $blacklisted = [
        'Transfer-Encoding:', 
        'Connection:', 
        'Content-Length:', 
        'Content-Encoding:', // Cloudflare will handle compression itself
        'Server:', 
        'Date:',
        'Strict-Transport-Security:'
    ];

    $isBlacklisted = false;
    foreach ($blacklisted as $b) {
        if (stripos($line, $b) === 0) {
            $isBlacklisted = true;
            break;
        }
    }

    if (!$isBlacklisted) {
        header($line);
    }
}

// Forward exact raw body (gzipped binary)
echo $body;