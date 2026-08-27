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

        if (str_starts_with($digits, '212')) {
            return $digits;
        }

        if (str_starts_with($digits, '0') && strlen($digits) >= 9) {
            return '212'.substr($digits, 1);
        }

        if (strlen($digits) === 9 && preg_match('/^[5-7]/', $digits) === 1) {
            return '212'.$digits;
        }

        return $digits;
    }

    public static function whatsappUrl(string $phone, string $text): string
    {
        $normalized = self::normalize($phone);

        return 'https://wa.me/'.$normalized.'?text='.rawurlencode($text);
    }
}
