<?php

namespace App\Support;

class Formats
{
    public static function decimal(mixed $value, int $scale): string
    {
        $formatted = number_format((float) $value, $scale, '.', '');
        $formatted = rtrim(rtrim($formatted, '0'), '.');

        return $formatted === '' ? '0' : $formatted;
    }

    public static function money(mixed $value): string
    {
        return number_format((float) $value, 2, '.', '');
    }
}
