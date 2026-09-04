<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        $product = $this->route('product');

        return $product instanceof Product
            && ($this->user()?->can('update', $product) ?? false);
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('name')) {
            $this->merge([
                'name' => trim((string) $this->input('name')),
            ]);
        }

        $barcode = trim((string) $this->input('barcode', ''));

        $this->merge([
            'barcode' => $barcode === '' ? null : $barcode,
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $product = $this->route('product');
        $productId = $product instanceof Product ? $product->id : null;

        return [
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'barcode' => [
                'nullable',
                'string',
                'max:64',
                Rule::unique('products', 'barcode')->ignore($productId),
            ],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['required', 'numeric', 'min:0'],
            'min_stock' => ['required', 'numeric', 'min:0'],
            'unit' => ['required', 'string', Rule::in([Product::UNIT_PIECE, Product::UNIT_KG])],
            'is_active' => ['required', 'boolean'],
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
            'remove_image' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Enter the name.',
            'category_id.required' => 'Choose a category.',
            'barcode.unique' => 'This barcode is already used.',
            'cost_price.required' => 'Enter the cost price.',
            'sale_price.required' => 'Enter the sale price.',
            'min_stock.required' => 'Enter the min stock.',
            'unit.required' => 'Choose a unit.',
            'image.image' => 'The photo must be an image.',
            'image.mimes' => 'The photo must be jpeg, png, or webp.',
            'image.max' => 'The photo is too large.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $product = $this->route('product');

            if (! $product instanceof Product) {
                return;
            }

            if ($this->input('unit') === $product->unit) {
                return;
            }

            if (round((float) $product->stock_quantity, 3) === 0.0) {
                return;
            }

            $validator->errors()->add(
                'unit',
                'Clear the stock before changing the unit.',
            );
        });
    }
}
