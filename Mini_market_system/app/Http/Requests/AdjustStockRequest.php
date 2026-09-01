<?php

namespace App\Http\Requests;

use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdjustStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        $product = $this->route('product');

        return $product instanceof Product
            && ($this->user()?->can('adjust', $product) ?? false);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'quantity' => ['required', 'numeric', 'min:0.001'],
            'direction' => ['required', Rule::in([
                StockMovement::DIRECTION_IN,
                StockMovement::DIRECTION_OUT,
            ])],
            'reason' => ['required', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'quantity.required' => 'Quantity must be greater than zero.',
            'quantity.min' => 'Quantity must be greater than zero.',
            'reason.required' => 'Enter a reason.',
        ];
    }
}
