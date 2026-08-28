<?php

namespace App\Http\Requests;

use App\Models\Purchase;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        $purchase = $this->route('purchase');

        return $purchase instanceof Purchase
            && ($this->user()?->can('update', $purchase) ?? false);
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'supplier_id.required' => 'Choose a supplier.',
            'supplier_id.exists' => 'Choose a supplier.',
            'items.required' => 'Add at least one product.',
            'items.min' => 'Add at least one product.',
            'items.*.quantity.min' => 'Enter a quantity for every product.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'invoice_number' => $this->blankToNull('invoice_number'),
            'notes' => $this->blankToNull('notes'),
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'purchase_date' => ['required', 'date'],
            'invoice_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.001'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'receive' => ['sometimes', 'boolean'],
        ];
    }

    private function blankToNull(string $key): ?string
    {
        if (! $this->has($key)) {
            return null;
        }

        $value = trim((string) $this->input($key));

        return $value === '' ? null : $value;
    }
}
