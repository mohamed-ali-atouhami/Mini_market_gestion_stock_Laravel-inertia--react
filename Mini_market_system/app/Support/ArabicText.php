<?php

namespace App\Support;

class ArabicText
{
    /** @var array<string, array{isolated: string, final: string, initial: string, medial: string}> */
    private const FORMS = [
        'ا' => ['isolated' => 'ﺍ', 'final' => 'ﺎ', 'initial' => 'ﺍ', 'medial' => 'ﺎ'],
        'أ' => ['isolated' => 'ﺃ', 'final' => 'ﺄ', 'initial' => 'ﺃ', 'medial' => 'ﺄ'],
        'إ' => ['isolated' => 'ﺇ', 'final' => 'ﺈ', 'initial' => 'ﺇ', 'medial' => 'ﺈ'],
        'آ' => ['isolated' => 'ﺁ', 'final' => 'ﺂ', 'initial' => 'ﺁ', 'medial' => 'ﺂ'],
        'ب' => ['isolated' => 'ﺏ', 'final' => 'ﺐ', 'initial' => 'ﺑ', 'medial' => 'ﺒ'],
        'ت' => ['isolated' => 'ﺕ', 'final' => 'ﺖ', 'initial' => 'ﺗ', 'medial' => 'ﺘ'],
        'ث' => ['isolated' => 'ﺙ', 'final' => 'ﺚ', 'initial' => 'ﺛ', 'medial' => 'ﺜ'],
        'ج' => ['isolated' => 'ﺝ', 'final' => 'ﺞ', 'initial' => 'ﺟ', 'medial' => 'ﺠ'],
        'ح' => ['isolated' => 'ﺡ', 'final' => 'ﺢ', 'initial' => 'ﺣ', 'medial' => 'ﺤ'],
        'خ' => ['isolated' => 'ﺥ', 'final' => 'ﺦ', 'initial' => 'ﺧ', 'medial' => 'ﺨ'],
        'د' => ['isolated' => 'ﺩ', 'final' => 'ﺪ', 'initial' => 'ﺩ', 'medial' => 'ﺪ'],
        'ذ' => ['isolated' => 'ﺫ', 'final' => 'ﺬ', 'initial' => 'ﺫ', 'medial' => 'ﺬ'],
        'ر' => ['isolated' => 'ﺭ', 'final' => 'ﺮ', 'initial' => 'ﺭ', 'medial' => 'ﺮ'],
        'ز' => ['isolated' => 'ﺯ', 'final' => 'ﺰ', 'initial' => 'ﺯ', 'medial' => 'ﺰ'],
        'س' => ['isolated' => 'ﺱ', 'final' => 'ﺲ', 'initial' => 'ﺳ', 'medial' => 'ﺴ'],
        'ش' => ['isolated' => 'ﺵ', 'final' => 'ﺶ', 'initial' => 'ﺷ', 'medial' => 'ﺸ'],
        'ص' => ['isolated' => 'ﺹ', 'final' => 'ﺺ', 'initial' => 'ﺻ', 'medial' => 'ﺼ'],
        'ض' => ['isolated' => 'ﺽ', 'final' => 'ﺾ', 'initial' => 'ﺿ', 'medial' => 'ﻀ'],
        'ط' => ['isolated' => 'ﻁ', 'final' => 'ﻂ', 'initial' => 'ﻃ', 'medial' => 'ﻄ'],
        'ظ' => ['isolated' => 'ﻅ', 'final' => 'ﻆ', 'initial' => 'ﻇ', 'medial' => 'ﻈ'],
        'ع' => ['isolated' => 'ﻉ', 'final' => 'ﻊ', 'initial' => 'ﻋ', 'medial' => 'ﻌ'],
        'غ' => ['isolated' => 'ﻍ', 'final' => 'ﻎ', 'initial' => 'ﻏ', 'medial' => 'ﻐ'],
        'ف' => ['isolated' => 'ﻑ', 'final' => 'ﻒ', 'initial' => 'ﻓ', 'medial' => 'ﻔ'],
        'ق' => ['isolated' => 'ﻕ', 'final' => 'ﻖ', 'initial' => 'ﻗ', 'medial' => 'ﻘ'],
        'ك' => ['isolated' => 'ﻙ', 'final' => 'ﻚ', 'initial' => 'ﻛ', 'medial' => 'ﻜ'],
        'ل' => ['isolated' => 'ﻝ', 'final' => 'ﻞ', 'initial' => 'ﻟ', 'medial' => 'ﻠ'],
        'م' => ['isolated' => 'ﻡ', 'final' => 'ﻢ', 'initial' => 'ﻣ', 'medial' => 'ﻤ'],
        'ن' => ['isolated' => 'ﻥ', 'final' => 'ﻦ', 'initial' => 'ﻧ', 'medial' => 'ﻨ'],
        'ه' => ['isolated' => 'ﻩ', 'final' => 'ﻪ', 'initial' => 'ﻫ', 'medial' => 'ﻬ'],
        'و' => ['isolated' => 'ﻭ', 'final' => 'ﻮ', 'initial' => 'ﻭ', 'medial' => 'ﻮ'],
        'ي' => ['isolated' => 'ﻱ', 'final' => 'ﻲ', 'initial' => 'ﻳ', 'medial' => 'ﻴ'],
        'ى' => ['isolated' => 'ﻯ', 'final' => 'ﻰ', 'initial' => 'ﻯ', 'medial' => 'ﻰ'],
        'ة' => ['isolated' => 'ﺓ', 'final' => 'ﺔ', 'initial' => 'ﺓ', 'medial' => 'ﺔ'],
        'ؤ' => ['isolated' => 'ﺅ', 'final' => 'ﺆ', 'initial' => 'ﺅ', 'medial' => 'ﺆ'],
        'ئ' => ['isolated' => 'ﺉ', 'final' => 'ﺊ', 'initial' => 'ﺋ', 'medial' => 'ﺌ'],
        'ء' => ['isolated' => 'ﺀ', 'final' => 'ﺀ', 'initial' => 'ﺀ', 'medial' => 'ﺀ'],
    ];

    /** @var array<string, array{isolated: string, final: string}> */
    private const LAM_ALEF = [
        'ا' => ['isolated' => 'ﻻ', 'final' => 'ﻼ'],
        'أ' => ['isolated' => 'ﻷ', 'final' => 'ﻸ'],
        'إ' => ['isolated' => 'ﻹ', 'final' => 'ﻺ'],
        'آ' => ['isolated' => 'ﻵ', 'final' => 'ﻶ'],
    ];

    public static function visual(string $text): string
    {
        if (! self::hasArabic($text)) {
            return $text;
        }

        $chars = self::chars($text);
        $runs = [];
        $buffer = [];
        $pending = [];
        $direction = null;

        foreach ($chars as $char) {
            $next = self::direction($char);

            if ($next === 'neutral') {
                $pending[] = $char;

                continue;
            }

            if ($direction === null || $direction === $next) {
                $buffer = array_merge($buffer, $pending, [$char]);
                $pending = [];
                $direction = $next;

                continue;
            }

            $runs[] = [$direction, $buffer];
            $buffer = array_merge($pending, [$char]);
            $pending = [];
            $direction = $next;
        }

        if ($direction !== null) {
            $runs[] = [$direction, array_merge($buffer, $pending)];
        } elseif ($pending !== []) {
            $runs[] = ['ltr', $pending];
        }

        foreach ($runs as &$run) {
            if ($run[0] !== 'arabic') {
                continue;
            }

            $run[1] = self::reverseClusters(self::chars(self::shape(implode('', $run[1]))));
        }
        unset($run);

        $visual = '';

        foreach (array_reverse($runs) as $run) {
            $visual .= implode('', $run[1]);
        }

        return $visual;
    }

    public static function hasArabic(string $text): bool
    {
        return preg_match('/\p{Arabic}/u', $text) === 1;
    }

    private static function shape(string $text): string
    {
        $chars = self::chars($text);
        $count = count($chars);
        $shaped = [];

        for ($index = 0; $index < $count; $index++) {
            $char = $chars[$index];
            $next = $chars[$index + 1] ?? null;

            if ($char === 'ل' && $next !== null && isset(self::LAM_ALEF[$next])) {
                $form = self::joinsPrevious($chars, $index) ? 'final' : 'isolated';
                $shaped[] = self::LAM_ALEF[$next][$form];
                $index++;

                continue;
            }

            if (! isset(self::FORMS[$char])) {
                $shaped[] = $char;

                continue;
            }

            $previous = self::joinsPrevious($chars, $index);
            $following = self::joinsNext($chars, $index);
            $form = match (true) {
                $previous && $following => 'medial',
                $previous => 'final',
                $following => 'initial',
                default => 'isolated',
            };
            $shaped[] = self::FORMS[$char][$form];
        }

        return implode('', $shaped);
    }

    /**
     * @param  list<string>  $chars
     */
    private static function joinsPrevious(array $chars, int $index): bool
    {
        for ($cursor = $index - 1; $cursor >= 0; $cursor--) {
            if (self::isTransparent($chars[$cursor])) {
                continue;
            }

            return self::joinsForward($chars[$cursor]);
        }

        return false;
    }

    /**
     * @param  list<string>  $chars
     */
    private static function joinsNext(array $chars, int $index): bool
    {
        $count = count($chars);

        for ($cursor = $index + 1; $cursor < $count; $cursor++) {
            if (self::isTransparent($chars[$cursor])) {
                continue;
            }

            return self::joinsBackward($chars[$cursor]);
        }

        return false;
    }

    private static function joinsForward(string $char): bool
    {
        return isset(self::FORMS[$char]) && self::FORMS[$char]['initial'] !== self::FORMS[$char]['isolated'];
    }

    private static function joinsBackward(string $char): bool
    {
        return isset(self::FORMS[$char]) && $char !== 'ء';
    }

    private static function isTransparent(string $char): bool
    {
        $code = mb_ord($char);

        return ($code >= 0x064B && $code <= 0x065F) || $code === 0x0670;
    }

    private static function direction(string $char): string
    {
        if (preg_match('/\p{Arabic}/u', $char) === 1 && ! self::isTransparent($char)) {
            $code = mb_ord($char);

            if ($code >= 0x0660 && $code <= 0x0669) {
                return 'ltr';
            }

            return 'arabic';
        }

        if (preg_match('/[A-Za-z0-9]/', $char) === 1) {
            return 'ltr';
        }

        return 'neutral';
    }

    /**
     * A vowel stays on the letter it belongs to when the line is turned around.
     *
     * @param  list<string>  $chars
     * @return list<string>
     */
    private static function reverseClusters(array $chars): array
    {
        $clusters = [];
        $current = [];

        foreach ($chars as $char) {
            if ($current !== [] && self::isTransparent($char)) {
                $current[] = $char;

                continue;
            }

            if ($current !== []) {
                $clusters[] = $current;
            }

            $current = [$char];
        }

        if ($current !== []) {
            $clusters[] = $current;
        }

        $reversed = [];

        foreach (array_reverse($clusters) as $cluster) {
            foreach ($cluster as $char) {
                $reversed[] = $char;
            }
        }

        return $reversed;
    }

    /**
     * @return list<string>
     */
    private static function chars(string $text): array
    {
        return preg_split('//u', $text, -1, PREG_SPLIT_NO_EMPTY) ?: [];
    }
}
