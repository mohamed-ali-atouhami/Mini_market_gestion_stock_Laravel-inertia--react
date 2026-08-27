<?php

namespace Tests\Unit;

use App\Support\Phone;
use PHPUnit\Framework\TestCase;

class PhoneTest extends TestCase
{
    public function test_moroccan_mobile_formats_normalize_to_the_same_number(): void
    {
        $expected = '212612345678';

        $this->assertSame($expected, Phone::normalize('0612345678'));
        $this->assertSame($expected, Phone::normalize('612345678'));
        $this->assertSame($expected, Phone::normalize('+212 6 12 34 56 78'));
        $this->assertSame($expected, Phone::normalize('00212612345678'));
        $this->assertSame($expected, Phone::normalize('212612345678'));
    }
}
