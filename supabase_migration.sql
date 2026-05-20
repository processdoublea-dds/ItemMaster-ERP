-- ============================================
-- Item Code Generator - Full Database Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- =====================
-- 1. Users Table
-- =====================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    emp_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    position TEXT,
    department TEXT,
    company TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    last_login TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Anon can read users (needed for login check)
DROP POLICY IF EXISTS "anon_select_users" ON public.users;
CREATE POLICY "anon_select_users" ON public.users
    FOR SELECT TO anon USING (true);

-- Anon can insert new users (auto-provisioning on first login)
DROP POLICY IF EXISTS "anon_insert_users" ON public.users;
CREATE POLICY "anon_insert_users" ON public.users
    FOR INSERT TO anon WITH CHECK (true);

-- Anon can update users (for last_login update)
DROP POLICY IF EXISTS "anon_update_users" ON public.users;
CREATE POLICY "anon_update_users" ON public.users
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_users_emp_id ON public.users (emp_id);

-- =====================
-- 2. Item Requests Table
-- =====================
CREATE TABLE IF NOT EXISTS public.item_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    requested_by TEXT NOT NULL REFERENCES public.users(emp_id),
    requested_name TEXT,
    item_code TEXT,
    item_name TEXT,
    form_data JSONB,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    processed_by TEXT,
    processed_at TIMESTAMPTZ,
    admin_note TEXT,
    erp_internal_id TEXT
);

ALTER TABLE public.item_requests ENABLE ROW LEVEL SECURITY;

-- Anon can read all requests
DROP POLICY IF EXISTS "anon_select_requests" ON public.item_requests;
CREATE POLICY "anon_select_requests" ON public.item_requests
    FOR SELECT TO anon USING (true);

-- Anon can insert requests
DROP POLICY IF EXISTS "anon_insert_requests" ON public.item_requests;
CREATE POLICY "anon_insert_requests" ON public.item_requests
    FOR INSERT TO anon WITH CHECK (true);

-- Anon can update requests (for admin status changes)
DROP POLICY IF EXISTS "anon_update_requests" ON public.item_requests;
CREATE POLICY "anon_update_requests" ON public.item_requests
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_item_requests_status ON public.item_requests (status);
CREATE INDEX IF NOT EXISTS idx_item_requests_requested_by ON public.item_requests (requested_by);
CREATE INDEX IF NOT EXISTS idx_item_requests_created_at ON public.item_requests (created_at DESC);

-- =====================
-- 3. Item Logs Table (existing, keep for audit)
-- =====================
CREATE TABLE IF NOT EXISTS public.item_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    action TEXT NOT NULL DEFAULT 'create',
    item_code TEXT,
    item_name TEXT,
    form_data JSONB,
    user_agent TEXT,
    note TEXT
);

ALTER TABLE public.item_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_logs" ON public.item_logs;
CREATE POLICY "anon_insert_logs" ON public.item_logs
    FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_logs" ON public.item_logs;
CREATE POLICY "anon_select_logs" ON public.item_logs
    FOR SELECT TO anon USING (true);

CREATE INDEX IF NOT EXISTS idx_item_logs_created_at ON public.item_logs (created_at DESC);

-- ============================================
-- 4. Automated Database Triggers for Audit Logs
-- ============================================

-- Trigger function to automatically log changes
CREATE OR REPLACE FUNCTION public.log_item_request_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.item_logs (action, item_code, item_name, form_data, note)
        VALUES ('create', NEW.item_code, NEW.item_name, NEW.form_data, 'คำขอสร้างรหัสสินค้าเริ่มต้นโดย: ' || COALESCE(NEW.requested_name, NEW.requested_by));
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.status IS DISTINCT FROM NEW.status) THEN
            INSERT INTO public.item_logs (action, item_code, item_name, form_data, note)
            VALUES (
                'update_status', 
                NEW.item_code, 
                NEW.item_name, 
                NEW.form_data, 
                'เปลี่ยนสถานะจาก ' || OLD.status || ' เป็น ' || NEW.status || 
                CASE WHEN NEW.admin_note IS NOT NULL AND NEW.admin_note <> '' THEN ' | หมายเหตุแอดมิน: ' || NEW.admin_note ELSE '' END ||
                CASE WHEN NEW.erp_internal_id IS NOT NULL AND NEW.erp_internal_id <> '' THEN ' | ERP ID: ' || NEW.erp_internal_id ELSE '' END
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create it
DROP TRIGGER IF EXISTS trigger_log_item_request_changes ON public.item_requests;
CREATE TRIGGER trigger_log_item_request_changes
    AFTER INSERT OR UPDATE ON public.item_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.log_item_request_changes();
