// lib/supabase.js - 检查配置
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 调试信息
console.log('Supabase 配置检查:')
console.log('- URL:', supabaseUrl ? '✅ 已设置' : '❌ 未设置')
console.log('- Anon Key:', supabaseAnonKey ? '✅ 已设置' : '❌ 未设置')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('缺少 Supabase 环境变量')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

console.log('✅ Supabase 客户端初始化成功')