-- ComplySub Supabase Schema
-- Idaho Subcontractor Insurance Compliance Tracking
-- Designed for Row-Level Security (multi-tenant isolation)

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TENANTS (consultant organizations)
-- ============================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL UNIQUE,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS (consultants + GC logins)
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('consultant', 'gc')),
  gc_id UUID REFERENCES general_contractors(id),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GENERAL CONTRACTORS
-- ============================================================
CREATE TABLE general_contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  license_number TEXT,
  compliance_threshold INTEGER DEFAULT 90 CHECK (compliance_threshold BETWEEN 0 AND 100),
  require_additional_insured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUBCONTRACTORS
-- ============================================================
CREATE TABLE subcontractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  ein TEXT,
  entity_type TEXT CHECK (entity_type IN ('LLC', 'S-Corp', 'Corporation', 'Sole Proprietor', 'Partnership')),
  is_sole_proprietor BOOLEAN DEFAULT false,
  w9_on_file BOOLEAN DEFAULT false,
  w9_uploaded_at TIMESTAMPTZ,
  w9_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GC <-> SUBCONTRACTOR junction
-- ============================================================
CREATE TABLE gc_subcontractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gc_id UUID NOT NULL REFERENCES general_contractors(id) ON DELETE CASCADE,
  sub_id UUID NOT NULL REFERENCES subcontractors(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gc_id, sub_id)
);

-- ============================================================
-- INSURANCE AGENTS
-- ============================================================
CREATE TABLE insurance_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  agency_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUB <-> AGENT junction
-- ============================================================
CREATE TABLE sub_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_id UUID NOT NULL REFERENCES subcontractors(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES insurance_agents(id) ON DELETE CASCADE,
  UNIQUE(sub_id, agent_id)
);

-- ============================================================
-- CERTIFICATES OF INSURANCE
-- ============================================================
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_id UUID NOT NULL REFERENCES subcontractors(id) ON DELETE CASCADE,
  coverage_type TEXT NOT NULL CHECK (coverage_type IN ('gl', 'wc')),
  policy_number TEXT NOT NULL,
  carrier TEXT NOT NULL,
  limit_per_occurrence INTEGER NOT NULL DEFAULT 0,
  limit_aggregate INTEGER NOT NULL DEFAULT 0,
  effective_date TIMESTAMPTZ NOT NULL,
  expiration_date TIMESTAMPTZ NOT NULL,
  additional_insured BOOLEAN DEFAULT false,
  is_ghost_policy BOOLEAN DEFAULT false,
  file_url TEXT,
  uploaded_by UUID REFERENCES insurance_agents(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_certificates_sub_id ON certificates(sub_id);
CREATE INDEX idx_certificates_expiration ON certificates(expiration_date);

-- ============================================================
-- EMAIL LOG
-- ============================================================
CREATE TABLE email_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  to_email TEXT NOT NULL,
  to_name TEXT,
  subject TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN (
    'cert_request', 'verification_request', 'expiration_warning',
    'lapse_notification', 'w9_renewal'
  )),
  sub_id UUID REFERENCES subcontractors(id),
  gc_id UUID REFERENCES general_contractors(id),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'bounced', 'failed')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ
);

-- ============================================================
-- NOTIFICATIONS (in-app)
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN (
    'cert_uploaded', 'cert_expiring', 'cert_expired',
    'sub_added', 'compliance_issue', 'verification_sent', 'agent_response'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  sub_id UUID REFERENCES subcontractors(id),
  gc_id UUID REFERENCES general_contractors(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read);

-- ============================================================
-- AGENT VERIFICATION TOKENS (public links for agents)
-- ============================================================
CREATE TABLE agent_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL UNIQUE,
  agent_id UUID NOT NULL REFERENCES insurance_agents(id),
  sub_id UUID NOT NULL REFERENCES subcontractors(id),
  gc_id UUID NOT NULL REFERENCES general_contractors(id),
  coverage_type TEXT NOT NULL CHECK (coverage_type IN ('gl', 'wc')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_avt_token ON agent_verification_tokens(token);

-- ============================================================
-- ROW-LEVEL SECURITY STUBS
-- ============================================================

-- Tenant isolation: users can only see data in their tenant
ALTER TABLE general_contractors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_gc" ON general_contractors
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_subs" ON subcontractors
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_certs" ON certificates
  FOR ALL USING (
    sub_id IN (SELECT id FROM subcontractors WHERE tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()))
  );

-- GC users can only see their own subcontractors
CREATE POLICY "gc_scoped_subs" ON gc_subcontractors
  FOR SELECT USING (
    gc_id = (SELECT gc_id FROM users WHERE id = auth.uid())
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'consultant'
  );

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Agent verification tokens are public (accessed via token, no auth)
ALTER TABLE agent_verification_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_token_access" ON agent_verification_tokens
  FOR SELECT USING (true);
