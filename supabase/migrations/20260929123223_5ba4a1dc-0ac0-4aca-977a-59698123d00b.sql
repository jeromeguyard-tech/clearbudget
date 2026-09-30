CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bucket text NOT NULL CHECK (bucket IN ('needs','wants','savings')),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own categories" ON public.categories FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX categories_user_idx ON public.categories(user_id, bucket, position);

CREATE OR REPLACE FUNCTION public.seed_default_categories(_uid uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.categories (user_id, bucket, name, position)
  SELECT _uid, b, n, p FROM (VALUES
    ('needs','Foyer',1),('needs','Loyer',2),('needs','Prêt',3),('needs','Alimentation',4),
    ('needs','Électricité',5),('needs','Gaz',6),('needs','Télécoms',7),('needs','Transport',8),
    ('needs','Santé',9),('needs','Assurances',10),
    ('wants','Loisirs',1),('wants','Restaurants & sorties',2),('wants','Shopping',3),
    ('wants','Voyages',4),('wants','Abonnements',5),
    ('savings','Épargne de précaution',1),('savings','Investissements',2),('savings','Assurance vie',3),
    ('savings','PEA',4),('savings','Compte-titres',5),('savings','Livret A',6)
  ) AS d(b, n, p);
$$;
REVOKE EXECUTE ON FUNCTION public.seed_default_categories(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  PERFORM public.seed_default_categories(NEW.id);
  RETURN NEW;
END;
$function$;

SELECT public.seed_default_categories(p.id) FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.user_id = p.id);