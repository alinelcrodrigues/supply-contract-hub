
-- Enum de papéis
CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'financeiro', 'leitura');

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Policies profiles
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_admin_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_admin_delete" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Policies user_roles
CREATE POLICY "user_roles_self_select" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles_admin_write" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- cost_centers
CREATE TABLE public.cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cost_centers TO authenticated;
GRANT ALL ON public.cost_centers TO service_role;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cost_centers_read" ON public.cost_centers FOR SELECT TO authenticated USING (true);
CREATE POLICY "cost_centers_admin_write" ON public.cost_centers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- role_permissions (matrix)
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission TEXT NOT NULL,
  UNIQUE (role, permission)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role_permissions_read" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "role_permissions_admin_write" ON public.role_permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER cost_centers_set_updated_at BEFORE UPDATE ON public.cost_centers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- On new user: create profile + assign role (first user = admin, else gestor)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count INT;
  assigned_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );

  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'gestor';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed cost centers
INSERT INTO public.cost_centers (code, name) VALUES
  ('CC-001', 'Obra Residencial Vila Nova'),
  ('CC-002', 'Obra Comercial Centro'),
  ('CC-003', 'Obra Industrial Norte'),
  ('CC-100', 'Administração Central');

-- Seed default permissions
INSERT INTO public.role_permissions (role, permission) VALUES
  ('admin', 'contracts.view'),
  ('admin', 'contracts.manage'),
  ('admin', 'measurements.manage'),
  ('admin', 'params.manage'),
  ('admin', 'users.manage'),
  ('gestor', 'contracts.view'),
  ('gestor', 'contracts.manage'),
  ('gestor', 'measurements.manage'),
  ('financeiro', 'contracts.view'),
  ('financeiro', 'measurements.manage'),
  ('leitura', 'contracts.view');
