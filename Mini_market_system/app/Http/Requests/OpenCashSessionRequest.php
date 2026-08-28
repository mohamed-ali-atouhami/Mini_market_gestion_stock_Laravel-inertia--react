<?php

namespace App\Http\Requests;

use App\Models\CashSession;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class OpenCashSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', CashSession::class) ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'opening_amount' => ['required', 'numeric', 'min:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'opening_amount.required' => 'Enter the opening amount.',
            'opening_amount.numeric' => 'Enter the opening amount.',
            'opening_amount.min' => 'Enter the opening amount.',
        ];
    }
}
