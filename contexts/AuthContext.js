// contexts/AuthContext.js - 添加自动用户创建
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 创建或更新用户信息到数据库
  const createOrUpdateUser = async (authUser) => {
    if (!authUser) return

    try {
      console.log('🔄 开始创建/更新用户信息...')
      
      // 从 GitHub 用户元数据获取信息
      const metadata = authUser.user_metadata || {}
      
      // 提取 GitHub ID
      let githubId = null
      if (metadata.provider_id) {
        githubId = parseInt(metadata.provider_id)
      } else if (metadata.sub) {
        githubId = parseInt(metadata.sub)
      } else if (metadata.user_name) {
        // 如果没有直接的 ID，尝试从其他字段推断
        console.warn('无法获取 GitHub ID，使用用户名哈希作为备选')
        githubId = metadata.user_name.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0)
          return a & a
        }, 0)
      }

      if (!githubId) {
        console.error('无法获取 GitHub ID，跳过用户创建')
        return
      }

      const userData = {
        auth_user_id: authUser.id,
        github_id: githubId,
        username: metadata.user_name || metadata.preferred_username || metadata.name || 'unknown',
        email: authUser.email,
        avatar_url: metadata.avatar_url,
        name: metadata.full_name || metadata.name,
        bio: metadata.bio || null,
        company: metadata.company || null,
        location: metadata.location || null,
        blog: metadata.blog || null,
        twitter_username: metadata.twitter_username || null,
        public_repos: metadata.public_repos || 0,
        followers: metadata.followers || 0,
        following: metadata.following || 0,
        last_login: new Date().toISOString()
      }

      console.log('📝 用户数据:', userData)

      // 尝试插入新用户或更新现有用户
      const { data, error } = await supabase
        .from('users')
        .upsert(userData, { 
          onConflict: 'github_id',
          ignoreDuplicates: false 
        })
        .select()

      if (error) {
        console.error('❌ 创建/更新用户失败:', error)
        
        // 如果是权限问题，尝试使用 RPC 函数
        if (error.code === '42501' || error.message.includes('permission')) {
          console.log('🔄 尝试使用 RPC 函数创建用户...')
          await createUserViaRPC(userData)
        }
      } else {
        console.log('✅ 用户信息创建/更新成功:', data)
      }

    } catch (error) {
      console.error('❌ 创建用户时发生异常:', error)
    }
  }

  // 通过 RPC 函数创建用户（备选方案）
  const createUserViaRPC = async (userData) => {
    try {
      const { data, error } = await supabase.rpc('create_or_update_user', userData)
      
      if (error) {
        console.error('❌ RPC 创建用户失败:', error)
      } else {
        console.log('✅ RPC 创建用户成功:', data)
      }
    } catch (error) {
      console.error('❌ RPC 调用异常:', error)
    }
  }

  useEffect(() => {
    if (!mounted) return

    const getInitialUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        // 如果用户已登录，确保用户信息在数据库中
        if (user) {
          await createOrUpdateUser(user)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('获取用户失败:', error)
        setLoading(false)
      }
    }

    getInitialUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 认证事件:', event)
        setUser(session?.user ?? null)
        setLoading(false)

        // 当用户登录时，创建或更新用户信息
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('👤 用户登录，开始处理用户信息...')
          await createOrUpdateUser(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [mounted])

  const signInWithGitHub = async () => {
    if (!mounted || typeof window === 'undefined') return

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('GitHub 登录失败:', error)
      throw error
    }
  }

  const signOut = async () => {
    if (!mounted) return

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
    } catch (error) {
      console.error('退出失败:', error)
      setUser(null)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGitHub, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}