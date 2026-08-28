<?php

namespace App\Http\Requests;

use App\Models\CashSession;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CloseCashSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $session = $this->route('cashSession');

        return $session instanceof CashSession
            && ($this->user()?->can('close', $session) ?? false);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'closing_amount' => ['required', 'numeric', 'min:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'closing_amount.required' => 'Enter the counted cash.',
            'closing_amount.numeric' => 'Enter the counted cash.',
            'closing_amount.min' => 'Enter the counted cash.',
        ];
    }
}
