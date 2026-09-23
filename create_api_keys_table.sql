-- API keys for developer / agency integrations
-- Partners call /api/integrations/{resource} with pk_ or sk_ in Authorization.
-- last_platform_source is the Origin / Referer URL of the caller (for PostHog).

CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_type character varying(20) NOT NULL CHECK (organization_type IN ('developer', 'agency')),
  organization_id uuid NOT NULL,
  name character varying(255) NOT NULL,
  description text,
  status character varying(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  environment character varying(20) NOT NULL DEFAULT 'live' CHECK (environment IN ('live', 'test')),
  publishable_key character varying(255) NOT NULL,
  secret_key_prefix character varying(64) NOT NULL,
  secret_key_hash text NOT NULL,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_platform_source text,
  created_by uuid,
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT api_keys_pkey PRIMARY KEY (id),
  CONSTRAINT api_keys_publishable_key_unique UNIQUE (publishable_key)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_api_keys_org ON public.api_keys (organization_type, organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON public.api_keys (status);
CREATE INDEX IF NOT EXISTS idx_api_keys_publishable_key ON public.api_keys (publishable_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_secret_prefix ON public.api_keys (secret_key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_permissions_gin ON public.api_keys USING gin (permissions);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON public.api_keys (created_by);

COMMENT ON TABLE public.api_keys IS 'Integration API keys for developers and agencies';
COMMENT ON COLUMN public.api_keys.organization_type IS 'developer or agency';
COMMENT ON COLUMN public.api_keys.organization_id IS 'developers.id or agencies.id';
COMMENT ON COLUMN public.api_keys.publishable_key IS 'pk_live_… stored in full; safe to show in the dashboard';
COMMENT ON COLUMN public.api_keys.secret_key_prefix IS 'Prefix + last 4 of sk_ for display; never store the full secret';
COMMENT ON COLUMN public.api_keys.secret_key_hash IS 'Hash of the secret key (bcrypt/argon2)';
COMMENT ON COLUMN public.api_keys.permissions IS 'JSONB scopes: { properties: { read, write, edit, delete }, leads: { ... }, ... }';
COMMENT ON COLUMN public.api_keys.last_platform_source IS 'Last Origin/Referer URL that called with this key (PostHog)';
COMMENT ON COLUMN public.api_keys.created_by IS 'auth.users id of the person who created the key';

CREATE OR REPLACE FUNCTION public.update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_api_keys_updated_at ON public.api_keys;
CREATE TRIGGER trigger_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_api_keys_updated_at();
