<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class ShopDemoSeeder extends Seeder
{
    /**
     * Morocco hanout catalog: 10 categories, a few suppliers, 100 products at stock 0.
     */
    public function run(): void
    {
        $categories = [];

        foreach ([
            'Drinks',
            'Dairy',
            'Bakery',
            'Snacks',
            'Grocery',
            'Canned food',
            'Tea & coffee',
            'Cleaning',
            'Hygiene',
            'Frozen',
        ] as $name) {
            $categories[$name] = Category::query()->firstOrCreate(
                ['name' => $name],
                ['is_active' => true],
            );
        }

        foreach ($this->suppliers() as $supplier) {
            Supplier::query()->firstOrCreate(
                ['name' => $supplier['name']],
                $supplier,
            );
        }

        foreach ($this->products() as $row) {
            [$categoryName, $name, $barcode, $cost, $sale, $minStock] = $row;

            Product::query()->firstOrCreate(
                ['barcode' => $barcode],
                [
                    'category_id' => $categories[$categoryName]->id,
                    'name' => $name,
                    'cost_price' => $cost,
                    'sale_price' => $sale,
                    'stock_quantity' => 0,
                    'min_stock' => $minStock,
                    'unit' => Product::UNIT_PIECE,
                    'is_active' => true,
                ],
            );
        }

        Setting::query()->updateOrCreate(
            ['id' => 1],
            [
                'shop_name' => 'Mini market',
                'shop_phone' => null,
                'shop_address' => null,
                'currency' => 'MAD',
                'ticket_footer' => 'Thank you',
                'low_stock_enabled' => true,
            ],
        );
    }

    /**
     * @return list<array{name: string, phone: string, address: string, notes: string, is_active: bool}>
     */
    private function suppliers(): array
    {
        return [
            [
                'name' => 'Coca-Cola Distribution',
                'phone' => '0522000000',
                'address' => 'Casablanca',
                'notes' => 'Pays on Friday',
                'is_active' => true,
            ],
            [
                'name' => 'Centrale Danone',
                'phone' => '0522300000',
                'address' => 'Casablanca',
                'notes' => 'Milk, yogurt, cheese',
                'is_active' => true,
            ],
            [
                'name' => 'Unilever Maroc',
                'phone' => '0522400000',
                'address' => 'Ain Sebaa',
                'notes' => 'Cleaning and hygiene',
                'is_active' => true,
            ],
            [
                'name' => 'Grossiste Derb',
                'phone' => '0661000000',
                'address' => 'Quartier',
                'notes' => 'Rice, oil, sugar, canned food',
                'is_active' => true,
            ],
        ];
    }

    /**
     * @return list<array{0: string, 1: string, 2: string, 3: float, 4: float, 5: int}>
     */
    private function products(): array
    {
        return [
            ['Drinks', 'Coca-Cola 1L', '6110000000017', 5.50, 8.00, 12],
            ['Drinks', 'Coca-Cola 2L', '6110000000024', 9.00, 13.00, 8],
            ['Drinks', 'Coca-Cola 33cl', '6112000000001', 3.20, 5.00, 24],
            ['Drinks', 'Coca-Cola Zero 33cl', '6112000000002', 3.20, 5.00, 12],
            ['Drinks', 'Fanta Orange 1L', '6112000000003', 5.20, 8.00, 12],
            ['Drinks', 'Fanta Orange 33cl', '6112000000004', 3.00, 5.00, 24],
            ['Drinks', 'Sprite 1L', '6112000000005', 5.20, 8.00, 12],
            ['Drinks', 'Sprite 33cl', '6112000000006', 3.00, 5.00, 24],
            ['Drinks', 'Hawai Tropical 1L', '6112000000007', 5.00, 7.50, 12],
            ['Drinks', 'Poms Pomme 1L', '6112000000008', 5.00, 7.50, 12],
            ['Drinks', 'Orangina 25cl', '6112000000009', 4.00, 6.00, 12],
            ['Drinks', 'Sidi Ali 1.5L', '6112000000010', 4.00, 6.00, 24],
            ['Drinks', 'Sidi Ali 33cl', '6112000000011', 2.00, 3.50, 24],
            ['Drinks', 'Ain Atlas 1.5L', '6112000000012', 3.50, 5.50, 18],
            ['Drinks', 'Oulmès 1L', '6112000000013', 4.50, 7.00, 12],
            ['Drinks', 'Schweppes Tonic 1L', '6112000000014', 6.00, 9.00, 8],

            ['Dairy', 'Lait Centrale 1L', '6112000000015', 8.00, 10.00, 18],
            ['Dairy', 'Lait Jaouda 1L', '6112000000016', 8.00, 10.00, 18],
            ['Dairy', 'Lait Jibal 1L', '6112000000017', 7.50, 9.50, 12],
            ['Dairy', 'Yaourt Danone Nature 4x', '6112000000018', 8.50, 11.00, 10],
            ['Dairy', 'Yaourt Danone Fraise 4x', '6112000000019', 9.00, 12.00, 10],
            ['Dairy', 'Raibi Centrale 1L', '6112000000020', 7.00, 9.00, 12],
            ['Dairy', 'Fromage La Vache Qui Rit 24p', '6112000000021', 18.00, 23.00, 6],
            ['Dairy', 'Fromage Kiri 8p', '6112000000022', 12.00, 16.00, 6],
            ['Dairy', 'Fromage Président Tranche 200g', '6112000000023', 16.00, 21.00, 6],
            ['Dairy', 'Beurre Centrale 200g', '6112000000024', 14.00, 18.00, 8],
            ['Dairy', 'Lben Jaouda 1L', '6112000000025', 6.50, 8.50, 10],
            ['Dairy', 'Crème fraîche 20cl', '6112000000026', 7.00, 10.00, 6],

            ['Bakery', 'Pain baguette', '6112000000027', 1.20, 1.50, 20],
            ['Bakery', 'Pain petit', '6112000000028', 0.80, 1.20, 20],
            ['Bakery', 'Pain de mie 500g', '6112000000029', 8.00, 11.00, 8],
            ['Bakery', 'Croissant', '6112000000030', 2.00, 3.00, 12],
            ['Bakery', 'Pain sandwich', '6112000000031', 2.50, 3.50, 12],
            ['Bakery', 'Gâteaux secs Bimo', '6112000000032', 4.50, 7.00, 10],
            ['Bakery', 'Madeleines pack', '6112000000033', 6.00, 9.00, 8],
            ['Bakery', 'Pain pita pack', '6112000000034', 5.00, 8.00, 8],

            ['Snacks', 'Chips Fromage 50g', '6112000000035', 2.50, 4.00, 18],
            ['Snacks', 'Chips Sel 50g', '6112000000036', 2.50, 4.00, 18],
            ['Snacks', 'Chips Paprika 150g', '6112000000037', 6.00, 9.00, 12],
            ['Snacks', 'Tapas Crackers', '6112000000038', 5.00, 8.00, 10],
            ['Snacks', 'Cacahuètes grillées 100g', '6112000000039', 4.00, 6.50, 12],
            ['Snacks', 'Chocolat Aiguebelle 100g', '6112000000040', 8.00, 11.00, 10],
            ['Snacks', 'Chocolat Milka 100g', '6112000000041', 10.00, 14.00, 8],
            ['Snacks', 'Kinder Bueno', '6112000000042', 6.00, 9.00, 12],
            ['Snacks', 'Bonbons Mentos', '6112000000043', 4.00, 6.00, 12],
            ['Snacks', 'Chewing-gum Trident', '6112000000044', 3.50, 5.50, 12],
            ['Snacks', 'Barre Twix', '6112000000045', 5.00, 7.50, 12],
            ['Snacks', 'Pop-corn sucré', '6112000000046', 3.00, 5.00, 10],
            ['Snacks', 'Gaufrettes Ideal', '6112000000047', 3.50, 5.50, 12],
            ['Snacks', 'Biscuits Tuc', '6112000000048', 6.00, 9.00, 8],

            ['Grocery', 'Couscous moyen 1kg', '6112000000049', 9.00, 12.00, 10],
            ['Grocery', 'Spaghetti Panzani 500g', '6112000000050', 8.00, 11.00, 12],
            ['Grocery', 'Riz long 1kg', '6112000000051', 12.00, 16.00, 10],
            ['Grocery', 'Farine 1kg', '6112000000052', 6.00, 8.50, 10],
            ['Grocery', 'Sucre 1kg', '6112000000053', 7.00, 9.00, 12],
            ['Grocery', 'Huile Lesieur 5L', '6112000000054', 85.00, 98.00, 4],
            ['Grocery', 'Huile Lesieur 1L', '6112000000055', 16.00, 20.00, 8],
            ['Grocery', 'Concentré tomate Aicha 400g', '6112000000056', 6.50, 9.00, 12],
            ['Grocery', 'Harissa 380g', '6112000000057', 8.00, 11.00, 8],
            ['Grocery', 'Sel de table 1kg', '6112000000058', 2.50, 4.00, 8],
            ['Grocery', 'Pois chiches 500g', '6112000000059', 7.00, 10.00, 8],
            ['Grocery', 'Lentilles 500g', '6112000000060', 8.00, 11.00, 8],

            ['Canned food', 'Thon Calvo à l\'huile', '6112000000061', 12.00, 16.00, 12],
            ['Canned food', 'Sardines à l\'huile', '6112000000062', 7.00, 10.00, 12],
            ['Canned food', 'Petits pois 400g', '6112000000063', 6.00, 8.50, 10],
            ['Canned food', 'Maïs doux 400g', '6112000000064', 7.00, 10.00, 10],
            ['Canned food', 'Haricots blancs 400g', '6112000000065', 6.50, 9.00, 8],
            ['Canned food', 'Concentré tomate 70g', '6112000000066', 2.00, 3.50, 18],
            ['Canned food', 'Olives vertes 200g', '6112000000067', 8.00, 12.00, 8],
            ['Canned food', 'Champignons 400g', '6112000000068', 9.00, 13.00, 6],

            ['Tea & coffee', 'Thé Soukaina 200g', '6112000000069', 18.00, 24.00, 8],
            ['Tea & coffee', 'Thé vert 250g', '6112000000070', 12.00, 16.00, 8],
            ['Tea & coffee', 'Nescafé Classic 50g', '6112000000071', 22.00, 28.00, 6],
            ['Tea & coffee', 'Café Najjar 200g', '6112000000072', 28.00, 35.00, 4],
            ['Tea & coffee', 'Café soluble sticks 25', '6112000000073', 18.00, 24.00, 8],
            ['Tea & coffee', 'Chocolat en poudre 400g', '6112000000074', 16.00, 22.00, 6],
            ['Tea & coffee', 'Infusion verveine', '6112000000075', 8.00, 12.00, 6],
            ['Tea & coffee', 'Caprice biscuits thé', '6112000000076', 7.00, 10.00, 8],

            ['Cleaning', 'Ariel 3kg', '6112000000077', 55.00, 68.00, 4],
            ['Cleaning', 'Tide 3kg', '6112000000078', 52.00, 65.00, 4],
            ['Cleaning', 'Persil liquide 3L', '6112000000079', 48.00, 62.00, 4],
            ['Cleaning', 'Eau de javel 1L', '6112000000080', 6.00, 9.00, 10],
            ['Cleaning', 'Ajax sol 1L', '6112000000081', 12.00, 16.00, 8],
            ['Cleaning', 'Jex crème', '6112000000082', 10.00, 14.00, 8],
            ['Cleaning', 'Liquide vaisselle 750ml', '6112000000083', 9.00, 13.00, 10],
            ['Cleaning', 'Éponges pack', '6112000000084', 4.00, 7.00, 10],
            ['Cleaning', 'Sacs poubelle 30L', '6112000000085', 8.00, 12.00, 8],
            ['Cleaning', 'Désodorisant spray', '6112000000086', 14.00, 19.00, 6],

            ['Hygiene', 'Dentifrice Signal', '6112000000087', 9.00, 13.00, 8],
            ['Hygiene', 'Savon Dove', '6112000000088', 6.00, 9.00, 12],
            ['Hygiene', 'Shampoing Head & Shoulders', '6112000000089', 28.00, 36.00, 6],
            ['Hygiene', 'Papier hygiénique 4 rouleaux', '6112000000090', 12.00, 16.00, 10],
            ['Hygiene', 'Serviettes Always', '6112000000091', 14.00, 19.00, 8],
            ['Hygiene', 'Gel douche Palmolive', '6112000000092', 16.00, 22.00, 6],
            ['Hygiene', 'Rasoirs jetables pack', '6112000000093', 10.00, 15.00, 8],
            ['Hygiene', 'Mouchoirs boîte', '6112000000094', 6.00, 9.00, 10],

            ['Frozen', 'Glace Coppelia vanille', '6112000000095', 12.00, 18.00, 6],
            ['Frozen', 'Glace bâtonnet', '6112000000096', 4.00, 7.00, 12],
            ['Frozen', 'Frites surgelées 1kg', '6112000000097', 18.00, 24.00, 4],
            ['Frozen', 'Petits pois surgelés 1kg', '6112000000098', 16.00, 22.00, 4],
        ];
    }
}
