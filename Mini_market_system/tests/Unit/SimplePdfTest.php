<?php

namespace Tests\Unit;

use App\Support\SimplePdf;
use PHPUnit\Framework\TestCase;

class SimplePdfTest extends TestCase
{
    public function test_a_table_repeats_its_header_on_the_next_page(): void
    {
        $pdf = new SimplePdf('Shop');
        $pdf->title('Shop');
        $pdf->heading('Caisse');

        $rows = [];
        for ($i = 0; $i < 50; $i++) {
            $rows[] = ['Younes', '2026-11-01 10:00', 'closed', '-20.00'];
        }

        $pdf->table(
            ['Cashier', 'Opened', 'Status', 'Difference'],
            $rows,
            [0.28, 0.34, 0.16, 0.22],
        );

        $body = $pdf->render();

        $this->assertStringStartsWith('%PDF', $body);
        $this->assertSame(2, substr_count($body, '(Difference)'));
        $this->assertStringContainsString('(-20.00)', $body);

        preg_match_all('/stream\n(.*?)\nendstream/s', $body, $streams);
        $this->assertCount(2, $streams[1]);
        $this->assertStringContainsString('(Difference)', $streams[1][1]);
        $this->assertMatchesRegularExpression('/Tm \(Difference\) Tj ET\s+BT.*?Tm \(Younes\)/', $streams[1][1]);
    }

    public function test_an_arabic_report_embeds_a_font_and_repeats_the_header(): void
    {
        $pdf = new SimplePdf('Shop', true, 'صفحة');
        $pdf->title('تقرير');
        $pdf->heading('الصندوق');

        $rows = [];
        for ($i = 0; $i < 50; $i++) {
            $rows[] = ['Younes', '2026-11-01 10:00', 'مغلق', '-20.00'];
        }

        $pdf->table(
            ['الصندوق', 'فُتح', 'الحالة', 'الفرق'],
            $rows,
            [0.28, 0.34, 0.16, 0.22],
        );

        $body = $pdf->render();

        $this->assertStringStartsWith('%PDF', $body);
        $this->assertStringContainsString('/FontFile2', $body);
        $this->assertStringContainsString('/Identity-H', $body);
        $this->assertStringContainsString('0.4 w BT', $body);
        $this->assertStringNotContainsString('2 Tr 0.4 w', $body);
        $this->assertStringNotContainsString('(Report)', $body);
        $this->assertSame(2, substr_count($body, '/Type /Page /Parent'));
    }
}
