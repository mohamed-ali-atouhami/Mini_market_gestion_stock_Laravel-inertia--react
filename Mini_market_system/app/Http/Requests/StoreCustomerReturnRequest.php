<?php

namespace App\Http\Requests;

use App\Models\CustomerReturn;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreCustomerReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', CustomerReturn::class) ?? false;
    }

    protected function prepareForValidation(): void
    {
        $items = $this->input('items', []);

        if (is_array($items)) {
            $clean = [];

            foreach ($items as $item) {
                if (! is_array($item)) {
                    continue;
                }

                foreach (['replacement_product_id', 'replacement_quantity', 'supplier_id'] as $key) {
                    if (! array_key_exists($key, $item)) {
                        continue;
                    }

                    $value = $item[$key];

                    if ($value === null) {
                        $item[$key] = null;

                        continue;
                    }

                    $item[$key] = trim((string) $value) === '' ? null : $value;
                }

                $clean[] = $item;
            }

            $this->merge(['items' => $clean]);
        }

        $this->merge([
            'amount_paid' => $this->blankToNull('amount_paid'),
            'reason' => $this->blankToNull('reason'),
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.action' => ['required', 'in:refund,replace'],
            'items.*.condition' => ['required', 'in:sellable,defective'],
            'items.*.returned_product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.returned_quantity' => ['required', 'numeric', 'min:0.001'],
            'items.*.replacement_product_id' => ['nullable', 'integer', 'exists:products,id'],
            'items.*.replacement_quantity' => ['nullable', 'numeric', 'min:0.001'],
            'items.*.supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'amount_paid' => ['nullable', 'numeric', 'min:0'],
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            foreach ($this->input('items', []) as $index => $item) {
                if (! is_array($item)) {
                    continue;
                }

                if (($item['action'] ?? '') !== CustomerReturn::ACTION_REPLACE) {
                    continue;
                }

                if (empty($item['replacement_product_id'])) {
                    $validator->errors()->add(
                        "items.{$index}.replacement_product_id",
                        'Scan the product they take now.',
                    );
                }

                if (empty($item['replacement_quantity'])) {
                    $validator->errors()->add(
                        "items.{$index}.replacement_quantity",
                        'Quantity must be greater than zero.',
                    );
                }
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.required' => 'Scan the product they brought back.',
            'items.min' => 'Scan the product they brought back.',
            'items.*.action.required' => 'Choose refund or replace.',
            'items.*.action.in' => 'Choose refund or replace.',
            'items.*.condition.required' => 'Choose if the item is still good.',
            'items.*.condition.in' => 'Choose if the item is still good.',
            'items.*.returned_product_id.required' => 'Scan the product they brought back.',
            'items.*.returned_product_id.exists' => 'Scan the product they brought back.',
            'items.*.returned_quantity.required' => 'Quantity must be greater than zero.',
            'items.*.returned_quantity.min' => 'Quantity must be greater than zero.',
            'items.*.replacement_quantity.min' => 'Quantity must be greater than zero.',
            'items.*.supplier_id.exists' => 'Choose a supplier.',
        ];
    }

    private function blankToNull(string $key): mixed
    {
        if (! $this->has($key)) {
            return null;
        }

        $value = $this->input($key);

        if ($value === null) {
            return null;
        }

        $trimmed = trim((string) $value);

        return $trimmed === '' ? null : $value;
    }
}
