
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 服务端客户端（用于管理员操作）
// export const supabaseAdmin = createClient(
//   supabaseUrl,
//   process.env.SUPABASE_SERVICE_ROLE_KEY
// )
