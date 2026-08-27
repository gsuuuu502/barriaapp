-- Migración: waitlist_entries (Feature #5, PRD §3.1 y §4)
--
-- Captura el email/contacto para el beneficio de los primeros 500 usuarios
-- (ADR-005). El modelo está desacoplado: la entrada no tiene FK obligatoria al
-- usuario anónimo al registrarse; el vínculo se crea al reclamar el beneficio.
--
-- RLS (ADR-004): RLS activo. Escrituras (join/claim) van por funciones
-- SECURITY DEFINER (owned por el rol de migración) que ejecutan SOLO la lógica
-- de negocio segura (cálculo de los primeros 500, vínculo con auth.uid()), con
-- guardas internas. Lectura: el usuario anónimo solo puede leer sus propias
-- entradas ya reclamadas.

CREATE TABLE public.waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact text NOT NULL UNIQUE,      -- email o teléfono
  created_at timestamptz NOT NULL DEFAULT now(),
  benefit_granted boolean NOT NULL DEFAULT false,
  claimed_by_user_id uuid REFERENCES auth.users NULL
);

ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;

-- Solo lectura de entradas ya reclamadas por el usuario actual.
CREATE POLICY waitlist_entries_select_own ON public.waitlist_entries
  FOR SELECT USING (claimed_by_user_id = auth.uid());

-- Unirse a la lista (dedupe por contact). Calcula si queda dentro de los
-- primeros 500 (benefit_granted). Retorna { id, granted, position }.
CREATE OR REPLACE FUNCTION public.join_waitlist(contact text)
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
  SELECT id INTO existing_id FROM public.waitlist_entries WHERE contact = $1;
  IF existing_id IS NOT NULL THEN
    SELECT benefit_granted INTO granted FROM public.waitlist_entries WHERE id = existing_id;
    SELECT count(*) INTO pos FROM public.waitlist_entries WHERE created_at <= (SELECT created_at FROM public.waitlist_entries WHERE id = existing_id);
    RETURN jsonb_build_object('id', existing_id, 'granted', granted, 'position', pos);
  END IF;

  SELECT count(*) INTO row_count FROM public.waitlist_entries;
  pos := row_count + 1;
  granted := pos <= 500;

  INSERT INTO public.waitlist_entries (contact, benefit_granted)
  VALUES ($1, granted)
  RETURNING id INTO result_id;

  RETURN jsonb_build_object('id', result_id, 'granted', granted, 'position', pos);
END;
$$;

-- Reclamar el beneficio: vincula la entrada a la sesión anónima actual.
-- Solo funciona si benefit_granted y aún no fue reclamada.
CREATE OR REPLACE FUNCTION public.claim_waitlist_benefit(contact text)
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
  WHERE contact = $1
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

GRANT EXECUTE ON FUNCTION public.join_waitlist(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_waitlist_benefit(text) TO anon, authenticated;
