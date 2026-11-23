<?php

namespace App\Support;

class LocaleCatalog
{
    /** @var array<string, array<string, string>> */
    private static array $cache = [];

    public static function line(string $locale, string $key): string
    {
        if ($locale === 'en' || $key === '') {
            return $key;
        }

        return self::load($locale)[$key] ?? $key;
    }

    /**
     * @return array<string, string>
     */
    private static function load(string $locale): array
    {
        if (isset(self::$cache[$locale])) {
            return self::$cache[$locale];
        }

        $path = resource_path('js/lang/'.$locale.'.json');

        if (! is_file($path)) {
            return self::$cache[$locale] = [];
        }

        $decoded = json_decode((string) file_get_contents($path), true);

        return self::$cache[$locale] = is_array($decoded) ? $decoded : [];
    }
}
