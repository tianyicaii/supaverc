// contexts/AuthContext.js - 支持自动用户创建
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

  // 确保用户记录存在的备用方法（如果触发器失败）
  const ensureUserRecord = async (authUser) => {
    if (!authUser || !mounted) return

    try {
      // 检查用户记录是否已存在
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single()

      if (checkError && checkError.code === 'PGRST116') {
        // 用户不存在，创建记录
        console.log('🔄 触发器可能失败，手动创建用户记录...')
        
        const metadata = authUser.user_metadata || {}
        
        const userData = {
          auth_user_id: authUser.id,
          github_id: parseInt(metadata.provider_id || metadata.sub || Date.now()),
          username: metadata.user_name || metadata.preferred_username || 'user',
          email: authUser.email,
          avatar_url: metadata.avatar_url,
          name: metadata.full_name || metadata.name,
          bio: metadata.bio,
          company: metadata.company,
          location: metadata.location,
          blog: metadata.blog,
          twitter_username: metadata.twitter_username,
          public_repos: metadata.public_repos || 0,
          followers: metadata.followers || 0,
          following: metadata.following || 0,
          last_login: new Date().toISOString()
        }

        const { data, error } = await supabase
          .from('users')
          .insert([userData])
          .select()

        if (error) {
          console.error('❌ 手动创建用户记录失败:', error)
        } else {
          console.log('✅ 手动创建用户记录成功:', data[0])
        }
      } else if (!checkError) {
        // 用户存在，更新最后登录时间
        const { error: updateError } = await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('auth_user_id', authUser.id)

        if (updateError) {
          console.error('❌ 更新最后登录时间失败:', updateError)
        } else {
          console.log('✅ 更新最后登录时间成功')
        }
      }
    } catch (error) {
      console.error('❌ 确保用户记录时发生异常:', error)
    }
  }

  useEffect(() => {
    if (!mounted) return

    let subscription = null

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('获取会话失败:', error)
          setUser(null)
        } else if (session && session.user) {
          console.log('✅ 找到现有会话:', session.user.email)
          setUser(session.user)
          
          // 确保用户记录存在
          await ensureUserRecord(session.user)
        } else {
          setUser(null)
        }

        setLoading(false)

        // 监听认证状态变化
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔄 认证状态变化:', event, session?.user?.email || 'no user')
            
            setUser(session?.user ?? null)
            setLoading(false)

            // 处理登录事件
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('👤 用户登录成功，确保用户记录存在...')
              
              // 延迟一秒确保触发器有时间执行
              setTimeout(async () => {
                await ensureUserRecord(session.user)
              }, 1000)
            }
          }
        )

        subscription = authSubscription

      } catch (error) {
        console.error('初始化认证失败:', error)
        setUser(null)
        setLoading(false)
      }
    }

    initializeAuth()

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [mounted])

  const signInWithGitHub = async () => {
    if (!mounted || typeof window === 'undefined') return

    try {
      console.log('🔑 开始 GitHub 登录...')
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'read:user user:email'
        }
      })
      
      if (error) {
        console.error('❌ GitHub OAuth 错误:', error)
        throw error
      }
      
    } catch (error) {
      console.error('❌ GitHub 登录失败:', error)
      throw error
    }
  }

  const signOut = async () => {
    if (!mounted) return

    try {
      console.log('🚪 开始退出登录...')
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ 退出失败:', error)
        throw error
      }
      
      setUser(null)
      
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      console.log('✅ 退出成功')
      
    } catch (error) {
      console.error('❌ 退出过程中发生错误:', error)
      setUser(null)
      throw error
    }
  }

  const value = {
    user,
    loading,
    signInWithGitHub,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}