<?php

namespace App\Support;

class Phone
{
    public static function normalize(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        }

        if (str_starts_with($digits, '0') && strlen($digits) >= 9) {
            $digits = '212'.substr($digits, 1);
        }

        return $digits;
    }

    public static function whatsappUrl(string $phone, string $text): string
    {
        $normalized = self::normalize($phone);

        return 'https://wa.me/'.$normalized.'?text='.rawurlencode($text);
    }
}
