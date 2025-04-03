-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW (),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW ()
);
-- Create trigger function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.profiles (id, email, name)
VALUES (new.id, new.email, new.email);
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Create trigger to fire on user creation
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Create forms table
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
  user_id UUID REFERENCES profiles (id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  form_structure JSONB NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}',
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW (),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW ()
);
-- Create form responses table
CREATE TABLE IF NOT EXISTS form_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
  form_id UUID REFERENCES forms (id) ON
DELETE CASCADE NOT NULL,
  response_data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW ()
);
-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR
UPDATE USING (auth.uid() = id);
-- Create RLS policies for forms
CREATE POLICY "Forms are viewable by owner" ON forms FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Forms are editable by owner" ON forms FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Forms can be created by authenticated users" ON forms FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Forms can be deleted by owner" ON forms FOR DELETE USING (auth.uid () = user_id);
-- Create RLS policies for form responses
CREATE POLICY "Responses are viewable by form owner" ON form_responses FOR
SELECT USING (
    EXISTS (
      SELECT 1
      FROM forms
      WHERE forms.id = form_responses.form_id
        AND forms.user_id = auth.uid()
    )
  );
CREATE POLICY "Anyone can submit responses to published forms" ON form_responses FOR
INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM forms
      WHERE forms.id = form_responses.form_id
        AND forms.is_published = TRUE
    )
  );
-- Create indexes for performance
CREATE INDEX idx_forms_user_id ON forms(user_id);
CREATE INDEX idx_form_responses_form_id ON form_responses(form_id);