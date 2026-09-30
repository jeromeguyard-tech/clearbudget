ALTER TABLE public.profiles
ADD COLUMN font_family text NOT NULL DEFAULT 'modern'
CHECK (font_family IN ('modern', 'classic', 'rounded'));

ALTER TABLE public.income_settings
ADD COLUMN transport_benefit_annual numeric NOT NULL DEFAULT 0 CHECK (transport_benefit_annual >= 0),
ADD COLUMN meal_vouchers_annual numeric NOT NULL DEFAULT 0 CHECK (meal_vouchers_annual >= 0);