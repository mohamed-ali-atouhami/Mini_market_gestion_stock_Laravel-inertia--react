<?php

namespace App\Http\Requests;

use App\Models\Sale;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreCreditPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $sale = $this->route('sale');

        return $sale instanceof Sale
            && ($this->user()?->can('collectCredit', $sale) ?? false);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0.01'],
        ];
    }
}
