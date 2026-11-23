<?php

namespace Tests\Unit;

use App\Support\ArabicText;
use PHPUnit\Framework\TestCase;

class ArabicTextTest extends TestCase
{
    public function test_arabic_letters_are_joined_and_shown_from_the_right(): void
    {
        $visual = ArabicText::visual('تقرير');

        $this->assertNotSame('تقرير', $visual);
        $this->assertStringStartsWith('ﺮ', $visual);
        $this->assertStringEndsWith('ﺗ', $visual);
    }

    public function test_numbers_stay_in_order_inside_an_arabic_line(): void
    {
        $visual = ArabicText::visual('1 نوفمبر 2026');

        $this->assertTrue(mb_strpos($visual, '2026') < mb_strpos($visual, '1'));
        $this->assertStringEndsWith('1', $visual);
        $this->assertStringContainsString('ﻧ', $visual);
    }

    public function test_a_vowel_stays_on_its_letter(): void
    {
        $this->assertStringEndsWith('ﻓُ', ArabicText::visual('فُتح'));
    }

    public function test_latin_text_is_left_unchanged(): void
    {
        $this->assertSame('Today Milk', ArabicText::visual('Today Milk'));
    }
}
