<?php

namespace App\Http\Requests;

use App\Models\Setting;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', Setting::current()) ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'shop_name' => ['required', 'string', 'max:255'],
            'shop_phone' => ['nullable', 'string', 'max:50'],
            'shop_address' => ['nullable', 'string', 'max:255'],
            'currency' => ['required', 'string', 'max:8'],
            'ticket_footer' => ['nullable', 'string', 'max:255'],
            'low_stock_enabled' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'shop_name.required' => 'Enter the shop name.',
            'currency.required' => 'Enter the currency.',
        ];
    }
}
