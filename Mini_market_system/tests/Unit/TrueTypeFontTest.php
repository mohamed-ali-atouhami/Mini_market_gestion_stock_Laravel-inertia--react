<?php

namespace Tests\Unit;

use App\Support\TrueTypeFont;
use PHPUnit\Framework\TestCase;

class TrueTypeFontTest extends TestCase
{
    public function test_the_report_font_can_draw_latin_and_arabic(): void
    {
        $font = TrueTypeFont::dejavu();

        $this->assertTrue($font->hasGlyph('A'));
        $this->assertTrue($font->hasGlyph('ﺗ'));
        $this->assertTrue($font->hasGlyph('ﺮ'));
        $this->assertGreaterThan(0, $font->textWidth('تقرير', 12));
    }
}
