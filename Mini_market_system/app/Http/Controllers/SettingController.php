<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateSettingRequest;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function edit(): Response
    {
        $settings = Setting::current();
        $this->authorize('view', $settings);

        return Inertia::render('Settings/Index', [
            'settings' => [
                'shop_name' => $settings->shop_name,
                'shop_phone' => $settings->shop_phone,
                'shop_address' => $settings->shop_address,
                'currency' => $settings->currency,
                'ticket_footer' => $settings->ticket_footer,
                'low_stock_enabled' => $settings->low_stock_enabled,
            ],
        ]);
    }

    public function update(UpdateSettingRequest $request): RedirectResponse
    {
        $settings = Setting::current();
        $data = $request->validated();
        $data['low_stock_enabled'] = $request->boolean('low_stock_enabled');

        $settings->update($data);

        return redirect()
            ->route('settings.edit')
            ->with('status', 'Settings saved.');
    }
}
