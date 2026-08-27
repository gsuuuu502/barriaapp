-- Migración: fixes waitlist functions (param p_contact) + saved_routes.destination nullable
--
-- 1) Las funciones join_waitlist/claim_waitlist_benefit usaban un parámetro
--    llamado `contact` que chocaba con la columna `contact` (error "column
--    reference contact is ambiguous"). Se recrean con parámetro `p_contact`.
-- 2) saved_routes.destination era NOT NULL pero la app ahora escribe
--    destination_lat/destination_lng (Feature #13). Se elimina la restricción.

DROP FUNCTION IF EXISTS public.join_waitlist(text);
DROP FUNCTION IF EXISTS public.claim_waitlist_benefit(text);

CREATE OR REPLACE FUNCTION public.join_waitlist(p_contact text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_id uuid;
  row_count int;
  result_id uuid;
  granted boolean;
  pos int;
BEGIN
  SELECT id INTO existing_id FROM public.waitlist_entries WHERE contact = p_contact;
  IF existing_id IS NOT NULL THEN
    SELECT benefit_granted INTO granted FROM public.waitlist_entries WHERE id = existing_id;
    SELECT count(*) INTO pos FROM public.waitlist_entries WHERE created_at <= (SELECT created_at FROM public.waitlist_entries WHERE id = existing_id);
    RETURN jsonb_build_object('id', existing_id, 'granted', granted, 'position', pos);
  END IF;

  SELECT count(*) INTO row_count FROM public.waitlist_entries;
  pos := row_count + 1;
  granted := pos <= 500;

  INSERT INTO public.waitlist_entries (contact, benefit_granted)
  VALUES (p_contact, granted)
  RETURNING id INTO result_id;

  RETURN jsonb_build_object('id', result_id, 'granted', granted, 'position', pos);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_waitlist_benefit(p_contact text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
  grant_state boolean;
BEGIN
  SELECT id, benefit_granted INTO target_id, grant_state
  FROM public.waitlist_entries
  WHERE contact = p_contact
  LIMIT 1;
  IF target_id IS NULL THEN
    RETURN false;
  END IF;
  IF NOT grant_state THEN
    RETURN false;
  END IF;

  UPDATE public.waitlist_entries
  SET claimed_by_user_id = auth.uid()
  WHERE id = target_id
    AND claimed_by_user_id IS NULL;

  RETURN FOUND;
END;
$$;

ALTER TABLE public.saved_routes
  ALTER COLUMN destination DROP NOT NULL;
