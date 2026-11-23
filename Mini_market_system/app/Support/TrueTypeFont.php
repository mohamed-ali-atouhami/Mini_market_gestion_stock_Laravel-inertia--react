<?php

namespace App\Support;

class TrueTypeFont
{
    private static ?self $dejavu = null;

    /** @var array<int, int> */
    private array $cmap = [];

    /** @var array<int, int> */
    private array $advances = [];

    private function __construct(
        private string $bytes,
        private int $unitsPerEm,
        private int $numGlyphs,
        private int $xMin,
        private int $yMin,
        private int $xMax,
        private int $yMax,
        private int $ascent,
        private int $descent,
    ) {}

    public static function dejavu(): self
    {
        return self::$dejavu ??= self::load(dirname(__FILE__).'/fonts/DejaVuSans.ttf');
    }

    public static function load(string $path): self
    {
        $bytes = file_get_contents($path);

        if (! is_string($bytes) || strlen($bytes) < 12) {
            throw new \RuntimeException('Could not read the report font.');
        }

        $font = new self($bytes, 0, 0, 0, 0, 0, 0, 0, 0);
        $font->readTables();

        return $font;
    }

    public function bytes(): string
    {
        return $this->bytes;
    }

    /**
     * @return list<int>
     */
    public function glyphIds(string $text): array
    {
        $ids = [];

        foreach (preg_split('//u', $text, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $char) {
            $ids[] = $this->cmap[mb_ord($char)] ?? 0;
        }

        return $ids;
    }

    public function textWidth(string $text, float $size): float
    {
        $width = 0.0;

        foreach ($this->glyphIds($text) as $glyph) {
            $width += ($this->advances[$glyph] ?? $this->advances[0] ?? 0) * $size / $this->unitsPerEm;
        }

        return $width;
    }

    public function widthArray(): string
    {
        $lines = ['0 ['];
        $line = '';

        for ($glyph = 0; $glyph < $this->numGlyphs; $glyph++) {
            $line .= $this->pdfWidth($glyph).' ';

            if ($glyph % 24 === 23) {
                $lines[] = $line;
                $line = '';
            }
        }

        if ($line !== '') {
            $lines[] = $line;
        }

        $lines[] = ']';

        return implode("\n", $lines);
    }

    /**
     * @return array{xMin: int, yMin: int, xMax: int, yMax: int, ascent: int, descent: int, capHeight: int}
     */
    public function pdfMetrics(): array
    {
        return [
            'xMin' => $this->scale($this->xMin),
            'yMin' => $this->scale($this->yMin),
            'xMax' => $this->scale($this->xMax),
            'yMax' => $this->scale($this->yMax),
            'ascent' => $this->scale($this->ascent),
            'descent' => $this->scale($this->descent),
            'capHeight' => $this->scale((int) round($this->ascent * 0.7)),
        ];
    }

    public function hasGlyph(string $char): bool
    {
        return ($this->cmap[mb_ord($char)] ?? 0) !== 0;
    }

    private function readTables(): void
    {
        $tables = [];
        $count = $this->u16(4);

        for ($index = 0; $index < $count; $index++) {
            $entry = 12 + ($index * 16);
            $tables[substr($this->bytes, $entry, 4)] = $this->u32($entry + 8);
        }

        foreach (['head', 'hhea', 'maxp', 'hmtx', 'cmap'] as $required) {
            if (! isset($tables[$required])) {
                throw new \RuntimeException('The report font is missing the '.$required.' table.');
            }
        }

        $head = $tables['head'];
        $this->unitsPerEm = $this->u16($head + 18);
        $this->xMin = $this->i16($head + 36);
        $this->yMin = $this->i16($head + 38);
        $this->xMax = $this->i16($head + 40);
        $this->yMax = $this->i16($head + 42);

        $hhea = $tables['hhea'];
        $this->ascent = $this->i16($hhea + 4);
        $this->descent = $this->i16($hhea + 6);
        $metrics = $this->u16($hhea + 34);

        $this->numGlyphs = $this->u16($tables['maxp'] + 4);
        $hmtx = $tables['hmtx'];

        for ($glyph = 0; $glyph < $metrics; $glyph++) {
            $this->advances[$glyph] = $this->u16($hmtx + ($glyph * 4));
        }

        $last = $this->advances[$metrics - 1] ?? 0;

        for ($glyph = $metrics; $glyph < $this->numGlyphs; $glyph++) {
            $this->advances[$glyph] = $last;
        }

        $this->readCmap($tables['cmap']);
    }

    private function readCmap(int $cmap): void
    {
        $subtables = $this->u16($cmap + 2);
        $chosen = null;

        for ($index = 0; $index < $subtables; $index++) {
            $record = $cmap + 4 + ($index * 8);
            $platform = $this->u16($record);
            $encoding = $this->u16($record + 2);
            $offset = $cmap + $this->u32($record + 4);
            $format = $this->u16($offset);

            if (($platform === 3 && $encoding === 1 && $format === 4) || ($platform === 0 && $format === 4)) {
                $chosen = [$format, $offset];

                break;
            }

            if ($chosen === null && ($format === 4 || $format === 12)) {
                $chosen = [$format, $offset];
            }
        }

        if ($chosen === null) {
            throw new \RuntimeException('The report font has no Unicode character map.');
        }

        if ($chosen[0] === 12) {
            $this->readCmap12($chosen[1]);

            return;
        }

        $this->readCmap4($chosen[1]);
    }

    private function readCmap4(int $offset): void
    {
        $segments = $this->u16($offset + 6) / 2;
        $ends = $offset + 14;
        $starts = $ends + ($segments * 2) + 2;
        $deltas = $starts + ($segments * 2);
        $rangeOffsets = $deltas + ($segments * 2);

        for ($segment = 0; $segment < $segments; $segment++) {
            $end = $this->u16($ends + ($segment * 2));
            $start = $this->u16($starts + ($segment * 2));
            $delta = $this->i16($deltas + ($segment * 2));
            $range = $this->u16($rangeOffsets + ($segment * 2));

            for ($code = $start; $code <= $end && $code !== 0xFFFF; $code++) {
                if ($range === 0) {
                    $glyph = ($code + $delta) & 0xFFFF;
                } else {
                    $glyphOffset = $rangeOffsets + ($segment * 2) + $range + (($code - $start) * 2);
                    $glyph = $this->u16($glyphOffset);

                    if ($glyph !== 0) {
                        $glyph = ($glyph + $delta) & 0xFFFF;
                    }
                }

                if ($glyph !== 0) {
                    $this->cmap[$code] = $glyph;
                }
            }
        }
    }

    private function readCmap12(int $offset): void
    {
        $groups = $this->u32($offset + 12);

        for ($group = 0; $group < $groups; $group++) {
            $entry = $offset + 16 + ($group * 12);
            $start = $this->u32($entry);
            $end = $this->u32($entry + 4);
            $glyph = $this->u32($entry + 8);

            for ($code = $start; $code <= $end; $code++) {
                $this->cmap[$code] = $glyph + ($code - $start);
            }
        }
    }

    private function pdfWidth(int $glyph): int
    {
        return $this->scale($this->advances[$glyph] ?? 0);
    }

    private function scale(int $value): int
    {
        if ($this->unitsPerEm === 0) {
            return 0;
        }

        return (int) round($value * 1000 / $this->unitsPerEm);
    }

    private function u16(int $offset): int
    {
        return unpack('n', substr($this->bytes, $offset, 2))[1];
    }

    private function i16(int $offset): int
    {
        $value = $this->u16($offset);

        return $value >= 0x8000 ? $value - 0x10000 : $value;
    }

    private function u32(int $offset): int
    {
        return unpack('N', substr($this->bytes, $offset, 4))[1];
    }
}
