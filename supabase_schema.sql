-- PROFESSIONAL AI ASSISTANT SCHEMA
-- GLOBAL & MULTI-TENANT SUPPORT

-- 1. PROFILES: User specific settings
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    full_name TEXT,
    avatar_url TEXT,
    language TEXT DEFAULT 'en', -- 'en' or 'tr'
    push_token TEXT,
    is_premium BOOLEAN DEFAULT false,
    subscription_status TEXT DEFAULT 'free',
    
    -- AI BYOK (Bring Your Own Key) Settings
    ai_api_key TEXT, 
    ai_provider TEXT DEFAULT 'google', -- 'google', 'openai', 'anthropic'
    use_own_api_key BOOLEAN DEFAULT false,

    -- External Integrations (OAuth)
    email TEXT,
    google_access_token TEXT,
    google_refresh_token TEXT
);

-- 2. INTERACTIONS: Chat history
CREATE TABLE public.interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    role TEXT CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb -- Stores extracted data if any
);

-- 3. DOCUMENTS (Extracted Data): No images, just facts
CREATE TABLE public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    doc_type TEXT, -- 'invoice', 'check', 'receipt', 'note'
    title TEXT,
    amount DECIMAL,
    currency TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    raw_analysis JSONB, -- AI interpretation
    status TEXT DEFAULT 'pending' -- 'pending', 'paid', 'archived'
);

-- 4. REMINDERS: Notifications queue
CREATE TABLE public.reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    reminder_at TIMESTAMP WITH TIME ZONE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_sent BOOLEAN DEFAULT false,
    reference_id UUID, -- Link to document or email
    priority TEXT DEFAULT 'normal' -- 'low', 'normal', 'high', 'critical'
);

-- 5. EMAILS: Summarized data
CREATE TABLE public.emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    subject TEXT,
    sender TEXT,
    summary TEXT,
    proposed_actions JSONB DEFAULT '[]'::jsonb,
    is_processed BOOLEAN DEFAULT false,
    external_id TEXT UNIQUE -- Gmail/Outlook Message ID
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- POLICIES: Users can only access their own records
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own interactions" ON public.interactions 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own documents" ON public.documents 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reminders" ON public.reminders 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own emails" ON public.emails 
    FOR ALL USING (auth.uid() = user_id);

-- AUTOMATIC PROFILE CREATION ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, language)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'en');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
