<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LocaleController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $locale = $request->validate([
            'locale' => ['required', 'in:en,ar'],
        ])['locale'];

        $request->session()->put('locale', $locale);

        return back()->cookie(cookie()->forever('locale', $locale));
    }
}
