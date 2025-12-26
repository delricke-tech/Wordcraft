/*
  # Auto-create profile on user signup

  This migration adds a trigger that automatically creates a profile
  when a new user signs up through Supabase Auth.

  1. Changes
    - Creates a function `handle_new_user` that inserts a profile row
    - Creates a trigger on `auth.users` that calls the function on INSERT

  2. Security
    - The trigger runs with security definer to bypass RLS
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
