"use client"

import { useState } from "react"
import { Copy, Check, ExternalLink, Database } from "lucide-react"

interface SupabaseSetupGuideProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupabaseSetupGuide({ open, onOpenChange }: SupabaseSetupGuideProps) {
  const [copiedStep, setCopiedStep] = useState<string | null>(null)

  const copyToClipboard = async (text: string, stepId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStep(stepId)
      setTimeout(() => setCopiedStep(null), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const sqlSchema = `-- Create workspaces table
CREATE TABLE workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sprints table
CREATE TABLE sprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('priority', 'backlog', 'custom')),
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  layout TEXT NOT NULL DEFAULT 'single' CHECK (layout IN ('single', 'two-column')),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stories table
CREATE TABLE stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sprint_id UUID REFERENCES sprints(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  prompt TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assignee TEXT,
  estimated_hours INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  openai_api_key TEXT,
  story_prefix TEXT NOT NULL DEFAULT 'TUNE',
  auto_save_interval INTEGER NOT NULL DEFAULT 30000,
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own workspaces" ON workspaces
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage sprints in their workspaces" ON sprints
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage stories in their sprints" ON stories
  FOR ALL USING (
    sprint_id IN (
      SELECT s.id FROM sprints s
      JOIN workspaces w ON s.workspace_id = w.id
      WHERE w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX idx_sprints_workspace_id ON sprints(workspace_id);
CREATE INDEX idx_stories_sprint_id ON stories(sprint_id);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);`

  const envExample = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here`

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-[rgba(28,28,28,0.5)] flex items-center justify-center z-50 p-5">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E0E0E0] bg-[#F8F8F8]">
          <h1 className="text-2xl font-bold text-[#1C1C1C] flex items-center gap-2">
            <Database size={24} className="text-[#FC8019]" />
            Supabase Setup Guide
          </h1>
          <p className="text-[#6B6B6B] mt-1">Configure cloud backup for your Scrum Master data</p>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-8">
            {/* Step 1: Create Supabase Project */}
            <div className="border border-[#E0E0E0] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#FC8019] text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold text-[#1C1C1C]">Create Supabase Project</h3>
              </div>

              <div className="space-y-3 text-[14px]">
                <p className="text-[#3E3E3E]">First, create a new Supabase project to store your data in the cloud.</p>

                <div className="bg-[#F5F5F5] rounded-lg p-4">
                  <ol className="space-y-2 text-[#3E3E3E]">
                    <li>
                      1. Go to{" "}
                      <a
                        href="https://supabase.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#FC8019] hover:underline inline-flex items-center gap-1"
                      >
                        supabase.com <ExternalLink size={12} />
                      </a>
                    </li>
                    <li>2. Sign up or log in to your account</li>
                    <li>3. Click "New Project"</li>
                    <li>4. Choose your organization and enter project details</li>
                    <li>5. Wait for the project to be created (2-3 minutes)</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Step 2: Get API Keys */}
            <div className="border border-[#E0E0E0] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#FC8019] text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold text-[#1C1C1C]">Get Your API Keys</h3>
              </div>

              <div className="space-y-3 text-[14px]">
                <p className="text-[#3E3E3E]">Copy your project URL and API keys from the Supabase dashboard.</p>

                <div className="bg-[#F5F5F5] rounded-lg p-4">
                  <ol className="space-y-2 text-[#3E3E3E]">
                    <li>1. In your Supabase project dashboard, go to Settings → API</li>
                    <li>2. Copy the "Project URL"</li>
                    <li>3. Copy the "anon public" key</li>
                    <li>4. Copy the "service_role" key (keep this secret!)</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Step 3: Set Environment Variables */}
            <div className="border border-[#E0E0E0] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#FC8019] text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold text-[#1C1C1C]">Configure Environment Variables</h3>
              </div>

              <div className="space-y-3 text-[14px]">
                <p className="text-[#3E3E3E]">
                  Add these environment variables to your <code className="bg-[#F5F5F5] px-1 rounded">.env.local</code>{" "}
                  file:
                </p>

                <div className="relative">
                  <pre className="bg-[#1C1C1C] text-[#E0E0E0] p-4 rounded-lg text-[12px] overflow-x-auto">
                    {envExample}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(envExample, "env")}
                    className="absolute top-2 right-2 p-2 bg-[#3E3E3E] hover:bg-[#FC8019] text-white rounded transition-colors"
                  >
                    {copiedStep === "env" ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>

                <div className="bg-[#FFF3E0] border border-[#FFE0B2] rounded-lg p-3">
                  <p className="text-[#FC8019] font-medium mb-1">⚠️ Important:</p>
                  <p className="text-[#3E3E3E] text-[13px]">
                    Replace the placeholder values with your actual Supabase project URL and keys. Never commit the
                    service role key to version control!
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4: Run Database Schema */}
            <div className="border border-[#E0E0E0] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#FC8019] text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <h3 className="text-lg font-semibold text-[#1C1C1C]">Setup Database Schema</h3>
              </div>

              <div className="space-y-3 text-[14px]">
                <p className="text-[#3E3E3E]">
                  Run this SQL in your Supabase SQL Editor to create the required tables:
                </p>

                <div className="bg-[#F5F5F5] rounded-lg p-4">
                  <ol className="space-y-2 text-[#3E3E3E] mb-3">
                    <li>1. In Supabase dashboard, go to SQL Editor</li>
                    <li>2. Click "New Query"</li>
                    <li>3. Copy and paste the SQL below</li>
                    <li>4. Click "Run" to execute</li>
                  </ol>
                </div>

                <div className="relative">
                  <pre className="bg-[#1C1C1C] text-[#E0E0E0] p-4 rounded-lg text-[11px] overflow-x-auto max-h-[300px]">
                    {sqlSchema}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(sqlSchema, "sql")}
                    className="absolute top-2 right-2 p-2 bg-[#3E3E3E] hover:bg-[#FC8019] text-white rounded transition-colors"
                  >
                    {copiedStep === "sql" ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 5: Enable Authentication */}
            <div className="border border-[#E0E0E0] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#FC8019] text-white rounded-full flex items-center justify-center font-bold">
                  5
                </div>
                <h3 className="text-lg font-semibold text-[#1C1C1C]">Enable Authentication (Optional)</h3>
              </div>

              <div className="space-y-3 text-[14px]">
                <p className="text-[#3E3E3E]">
                  For now, the app works without authentication. Future updates will include user accounts.
                </p>

                <div className="bg-[#E8F5E8] border border-[#C8E6C9] rounded-lg p-3">
                  <p className="text-[#2E7D32] font-medium mb-1">✅ Ready to go!</p>
                  <p className="text-[#3E3E3E] text-[13px]">
                    Your data will now be automatically backed up to Supabase. The app will show "Cloud Backup" instead
                    of "Local Only".
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E0E0E0] bg-[#F8F8F8] flex justify-between items-center">
          <div className="text-[13px] text-[#6B6B6B]">
            Need help? Check the{" "}
            <a
              href="https://supabase.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FC8019] hover:underline"
            >
              Supabase documentation
            </a>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-[#FC8019] text-white rounded-lg hover:bg-[#E6722E] transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  )
}
