-- Supabase CRM & ERP RBAC Schema

-- Drop existing queue and senders if needed (CAUTION: THIS DELETES DATA)
-- DROP TABLE IF EXISTS queue;
-- DROP TABLE IF EXISTS senders;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE (Linked to auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'employee', -- 'admin' or 'employee'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: Users can only see their own profile, Admins can see all.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON public.users FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger to automatically create a user profile when they sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role VARCHAR(50);
BEGIN
  IF new.email = 'admin@autoemailer.com' THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'employee');
  END IF;

  INSERT INTO public.users (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', assigned_role);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger (drop first if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- SENDERS TABLE (Now linked to users)
CREATE TABLE public.senders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    app_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CLIENTS TABLE (CRM)
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    status VARCHAR(50) DEFAULT 'lead', -- 'lead', 'contacted', 'converted'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TASKS TABLE (ERP)
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assigned_to UUID REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QUEUE TABLE (Updated with employee tracking)
CREATE TABLE public.queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL REFERENCES public.senders(email),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_queue_status_rbac ON public.queue(status) WHERE status = 'pending';
