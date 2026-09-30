CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text,
  language text NOT NULL DEFAULT 'fr',
  theme text NOT NULL DEFAULT 'dark',
  accent text NOT NULL DEFAULT '#00d6a4',
  currency text NOT NULL DEFAULT 'EUR',
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.income_settings (
  user_id uuid PRIMARY KEY,
  fixed_annual numeric NOT NULL DEFAULT 0,
  variable_annual numeric NOT NULL DEFAULT 0,
  other_annual numeric NOT NULL DEFAULT 0,
  months integer NOT NULL DEFAULT 12,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.income_settings TO authenticated;
GRANT ALL ON public.income_settings TO service_role;
ALTER TABLE public.income_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own income" ON public.income_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.recurring_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  debit_day integer NOT NULL DEFAULT 1,
  bank_account text,
  primary_category text NOT NULL DEFAULT 'needs',
  secondary_category text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_expenses TO authenticated;
GRANT ALL ON public.recurring_expenses TO service_role;
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recurring" ON public.recurring_expenses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX recurring_expenses_user_idx ON public.recurring_expenses (user_id);

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  primary_category text NOT NULL DEFAULT 'needs',
  secondary_category text,
  comment text,
  occurred_on date NOT NULL DEFAULT current_date,
  source text NOT NULL DEFAULT 'daily',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own transactions" ON public.transactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX transactions_user_date_idx ON public.transactions (user_id, occurred_on DESC);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();