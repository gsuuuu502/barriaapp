-- Migración: emergency_contacts.user_id DEFAULT auth.uid()
-- Permite que el cliente inserte contactos sin gestionar el user_id en la app;
-- el servidor lo fija con auth.uid() (misma intención que nuestras funciones RPC
-- para geography), y la política RLS insert_own (WITH CHECK auth.uid() = user_id)
-- se cumple porque el default coincide con el usuario que inserta.

ALTER TABLE public.emergency_contacts
  ALTER COLUMN user_id SET DEFAULT auth.uid();
