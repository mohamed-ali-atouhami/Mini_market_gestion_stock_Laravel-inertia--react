<?php

namespace App\Http\Requests;

use App\Models\Sale;
use App\Support\Phone;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Sale::class) ?? false;
    }

    protected function prepareForValidation(): void
    {
        $method = $this->input('payment_method', Sale::PAYMENT_CASH);
        $paid = $this->input('amount_paid');

        $this->merge([
            'payment_method' => $method,
            'amount_paid' => $method === Sale::PAYMENT_CREDIT && ($paid === null || $paid === '')
                ? 0
                : $paid,
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $credit = $this->input('payment_method') === Sale::PAYMENT_CREDIT;

        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.001'],
            'payment_method' => ['required', 'in:cash,credit'],
            'amount_paid' => ['required', 'numeric', 'min:0'],
            'customer_name' => [$credit ? 'required' : 'nullable', 'string', 'max:100'],
            'customer_phone' => [$credit ? 'required' : 'nullable', 'string', 'max:20'],
            'due_date' => [$credit ? 'required' : 'nullable', 'date', 'after_or_equal:today'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($this->input('payment_method') !== Sale::PAYMENT_CREDIT) {
                return;
            }

            $normalized = Phone::normalize((string) $this->input('customer_phone'));

            if (strlen($normalized) < 9) {
                $validator->errors()->add('customer_phone', 'Enter a valid phone number.');
            }
        });
    }
}
