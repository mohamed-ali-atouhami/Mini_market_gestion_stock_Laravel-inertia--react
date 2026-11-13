<?php

namespace App\Support;

class SimplePdf
{
    private const WIDTH = 595.28;

    private const HEIGHT = 841.89;

    private const MARGIN = 40.0;

    /** @var list<list<string>> */
    private array $pages = [[]];

    private int $page = 0;

    private float $y;

    public function __construct(private string $footer = 'Report')
    {
        $this->y = self::HEIGHT - self::MARGIN;
    }

    public function title(string $text): void
    {
        $this->ensure(24);
        $this->textAt($this->fit($text, $this->contentWidth(), 18), self::MARGIN, $this->y, 18, true);
        $this->y -= 22;
    }

    public function subtitle(string $text): void
    {
        $this->ensure(16);
        $this->textAt($this->fit($text, $this->contentWidth(), 11), self::MARGIN, $this->y, 11, false, '0.35 0.35 0.35');
        $this->y -= 16;
    }

    public function heading(string $text): void
    {
        $this->ensure(52);
        $this->y -= 8;
        $this->textAt($this->fit($text, $this->contentWidth(), 13), self::MARGIN, $this->y, 13, true);
        $this->y -= 6;
        $this->rule();
        $this->y -= 14;
    }

    public function paragraph(string $text): void
    {
        $this->ensure(16);
        $this->textAt($this->fit($text, $this->contentWidth(), 10), self::MARGIN, $this->y, 10, false, '0.35 0.35 0.35');
        $this->y -= 16;
    }

    /**
     * @param  list<array{label: string, value: string, color?: string}>  $items
     */
    public function metrics(array $items): void
    {
        if ($items === []) {
            return;
        }

        $gap = 8.0;
        $height = 46.0;
        $width = ($this->contentWidth() - ($gap * (count($items) - 1))) / count($items);
        $this->ensure($height + 8);
        $top = $this->y;
        $x = self::MARGIN;

        foreach ($items as $item) {
            $this->rect($x, $top - $height, $width, $height, '0.96 0.96 0.96');
            $this->textAt($this->fit($item['label'], $width - 12, 8), $x + 6, $top - 16, 8, false, '0.40 0.40 0.40');
            $this->textAt(
                $this->fit($item['value'], $width - 12, 11),
                $x + 6,
                $top - 34,
                11,
                true,
                $item['color'] ?? '0 0 0',
            );
            $x += $width + $gap;
        }

        $this->y = $top - $height - 12;
    }

    /**
     * @param  list<array{label: string, value: float}>  $bars
     */
    public function bars(array $bars): void
    {
        if ($bars === []) {
            return;
        }

        $chartHeight = 88.0;
        $this->ensure($chartHeight + 20);
        $max = max(array_map(fn (array $bar): float => $bar['value'], $bars));
        $max = $max > 0 ? $max : 1;
        $count = count($bars);
        $gap = 6.0;
        $slot = ($this->contentWidth() - ($gap * ($count - 1))) / $count;
        $barWidth = min(16.0, $slot * 0.72);
        $base = $this->y - $chartHeight;
        $x = self::MARGIN;

        $this->pages[$this->page][] = sprintf(
            '0.85 0.85 0.85 RG 0.4 w %.2f %.2f m %.2f %.2f l S',
            self::MARGIN,
            $base,
            self::WIDTH - self::MARGIN,
            $base,
        );

        foreach ($bars as $bar) {
            $height = ($bar['value'] / $max) * ($chartHeight - 8);
            if ($bar['value'] > 0 && $height < 1) {
                $height = 1;
            }

            if ($height > 0) {
                $this->rect($x + (($slot - $barWidth) / 2), $base, $barWidth, $height, '0.13 0.77 0.37');
            }

            $this->textAt(
                $this->fit($bar['label'], $slot, 7),
                $x,
                $base - 12,
                7,
                false,
                '0.35 0.35 0.35',
            );
            $x += $slot + $gap;
        }

        $this->y = $base - 22;
    }

    /**
     * @param  list<string>  $headers
     * @param  list<list<string>>  $rows
     * @param  list<float>  $widths
     */
    public function table(array $headers, array $rows, array $widths): void
    {
        $columns = $this->columns($widths);
        $this->row($headers, $columns, true, '0.93 0.93 0.93');

        foreach ($rows as $row) {
            if (! $this->fits(16)) {
                $this->ensure(16);
                $this->row($headers, $columns, true, '0.93 0.93 0.93');
            }

            $this->row($row, $columns, false, null);
        }

        $this->y -= 6;
    }

    public function render(): string
    {
        $pageCount = count($this->pages);
        $objects = [];
        $pageIds = [];
        $contentIds = [];
        $next = 3;

        foreach ($this->pages as $commands) {
            $pageIds[] = $next;
            $contentIds[] = $next + 1;
            $next += 2;
            unset($commands);
        }

        $fontId = $next;
        $boldId = $next + 1;
        $kids = implode(' ', array_map(fn (int $id): string => $id.' 0 R', $pageIds));

        $objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        $objects[2] = "<< /Type /Pages /Kids [{$kids}] /Count {$pageCount} >>";

        foreach ($this->pages as $index => $commands) {
            $footer = sprintf(
                'BT /F1 8 Tf 0.45 0.45 0.45 rg 1 0 0 1 %.2f 24 Tm (%s) Tj ET',
                self::MARGIN,
                $this->escape($this->footer.' - Page '.($index + 1)),
            );
            $stream = implode("\n", $commands);
            if ($stream !== '') {
                $stream .= "\n";
            }
            $stream .= $footer;

            $objects[$pageIds[$index]] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents {$contentIds[$index]} 0 R /Resources << /Font << /F1 {$fontId} 0 R /F2 {$boldId} 0 R >> >> >>";
            $objects[$contentIds[$index]] = '<< /Length '.strlen($stream)." >>\nstream\n".$stream."\nendstream";
        }

        $objects[$fontId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
        $objects[$boldId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

        $body = "%PDF-1.4\n";
        $offsets = [];
        $max = max(array_keys($objects));

        for ($id = 1; $id <= $max; $id++) {
            $offsets[$id] = strlen($body);
            $body .= $id." 0 obj\n".$objects[$id]."\nendobj\n";
        }

        $xref = strlen($body);
        $body .= 'xref'."\n".'0 '.($max + 1)."\n";
        $body .= "0000000000 65535 f \n";

        for ($id = 1; $id <= $max; $id++) {
            $body .= sprintf("%010d 00000 n \n", $offsets[$id]);
        }

        $body .= "trailer\n<< /Size ".($max + 1)." /Root 1 0 R >>\n";
        $body .= "startxref\n{$xref}\n%%EOF";

        return $body;
    }

    /**
     * @param  list<float>  $widths
     * @return list<float>
     */
    private function columns(array $widths): array
    {
        $total = array_sum($widths) ?: 1;

        return array_map(
            fn (float $width): float => $this->contentWidth() * ($width / $total),
            $widths,
        );
    }

    /**
     * @param  list<string>  $cells
     * @param  list<float>  $columns
     */
    private function row(array $cells, array $columns, bool $bold, ?string $fill): void
    {
        $this->ensure(16);
        $x = self::MARGIN;
        $top = $this->y;

        if ($fill !== null) {
            $this->rect($x, $top - 16, array_sum($columns), 16, $fill);
        }

        foreach ($columns as $index => $width) {
            $this->textAt(
                $this->fit((string) ($cells[$index] ?? ''), $width - 8, 9),
                $x + 4,
                $top - 11,
                9,
                $bold,
            );
            $x += $width;
        }

        $this->y -= 16;
    }

    private function rule(): void
    {
        $this->pages[$this->page][] = sprintf(
            '0.85 0.85 0.85 RG 0.6 w %.2f %.2f m %.2f %.2f l S',
            self::MARGIN,
            $this->y,
            self::WIDTH - self::MARGIN,
            $this->y,
        );
    }

    private function rect(float $x, float $y, float $width, float $height, string $rgb): void
    {
        $this->pages[$this->page][] = sprintf(
            '%s rg %.2f %.2f %.2f %.2f re f',
            $rgb,
            $x,
            $y,
            $width,
            $height,
        );
    }

    private function textAt(
        string $text,
        float $x,
        float $y,
        float $size,
        bool $bold = false,
        string $color = '0 0 0',
    ): void {
        $this->pages[$this->page][] = sprintf(
            'BT /%s %.2f Tf %s rg 1 0 0 1 %.2f %.2f Tm (%s) Tj ET',
            $bold ? 'F2' : 'F1',
            $size,
            $color,
            $x,
            $y,
            $this->escape($text),
        );
    }

    private function fits(float $height): bool
    {
        return $this->y - $height >= self::MARGIN + 18;
    }

    private function ensure(float $height): void
    {
        if ($this->fits($height)) {
            return;
        }

        $this->pages[] = [];
        $this->page++;
        $this->y = self::HEIGHT - self::MARGIN;
    }

    private function contentWidth(): float
    {
        return self::WIDTH - (self::MARGIN * 2);
    }

    private function fit(string $text, float $width, float $size): string
    {
        $text = preg_replace('/\s+/', ' ', trim($text)) ?? '';
        $max = max(1, (int) floor($width / ($size * 0.52)));

        if (mb_strlen($text) <= $max) {
            return $text;
        }

        return mb_substr($text, 0, max(1, $max - 3)).'...';
    }

    private function escape(string $text): string
    {
        $converted = iconv('UTF-8', 'Windows-1252//IGNORE', $text);

        if (! is_string($converted) || ($converted === '' && $text !== '')) {
            $converted = preg_replace('/[^\x20-\x7E]/', '?', $text) ?? '';
        }

        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $converted);
    }
}
