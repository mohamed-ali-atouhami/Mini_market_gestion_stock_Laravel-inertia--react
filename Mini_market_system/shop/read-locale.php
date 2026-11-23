<?php

// Prints the shop language for the opening screen: en, fr, es, or ar.
// Used only when storage/app/shop-locale.txt does not exist yet.

$root = dirname(__DIR__);
$file = $root.'/storage/app/shop-locale.txt';

if (is_file($file)) {
    $saved = trim((string) file_get_contents($file));
    if (in_array($saved, ['en', 'fr', 'es', 'ar'], true)) {
        echo $saved;
        exit(0);
    }
}

$dbFile = $root.'/database/database.sqlite';

if (is_file($dbFile)) {
    try {
        $db = new PDO('sqlite:'.$dbFile, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);
        $rows = $db->query('SELECT payload FROM sessions ORDER BY last_activity DESC LIMIT 30');

        foreach ($rows as $row) {
            $raw = base64_decode((string) ($row['payload'] ?? ''), true);
            if (! is_string($raw)) {
                continue;
            }

            if (preg_match('/locale";s:\d+:"(en|fr|es|ar)"/', $raw, $matches) === 1) {
                file_put_contents($file, $matches[1]);
                echo $matches[1];
                exit(0);
            }
        }
    } catch (Throwable $exception) {
        // Fall through to the default language.
    }
}

echo 'en';
