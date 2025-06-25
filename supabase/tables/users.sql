
-- 创建 users 表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id BIGINT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  name TEXT,
  bio TEXT,
  company TEXT,
  location TEXT,
  blog TEXT,
  twitter_username TEXT,
  public_repos INTEGER,
  followers INTEGER,
  following INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建更新时间的触发器
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();


-- 设置行级安全策略 (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;


-- 允许用户查看和更新自己的记录
CREATE POLICY "Users can view own record" ON users
  FOR SELECT USING (auth.uid()::text = id::text);


CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);


-- 允许插入新用户（通过服务端）
CREATE POLICY "Enable insert for authenticated users" ON users
  FOR INSERT WITH CHECK (true);
