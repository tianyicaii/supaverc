// contexts/AuthContext.js - 改进会话处理
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

  useEffect(() => {
    if (!mounted) return

    let subscription = null

    const initializeAuth = async () => {
      try {
        // 尝试获取当前会话
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('获取会话失败:', error)
          // 如果获取会话失败，清理状态
          setUser(null)
        } else if (session && session.user) {
          console.log('找到现有会话:', session.user.email)
          setUser(session.user)
        } else {
          console.log('没有现有会话')
          setUser(null)
        }

        setLoading(false)

        // 监听认证状态变化
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('认证状态变化:', event, session?.user?.email || 'no user')
            
            setUser(session?.user ?? null)
            setLoading(false)

            // 处理不同的认证事件
            switch (event) {
              case 'SIGNED_IN':
                console.log('✅ 用户登录成功')
                break
              case 'SIGNED_OUT':
                console.log('🚪 用户已退出')
                break
              case 'TOKEN_REFRESHED':
                console.log('🔄 令牌已刷新')
                break
              case 'USER_UPDATED':
                console.log('👤 用户信息已更新')
                break
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
      console.log('开始 GitHub 登录...')
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'read:user user:email'
        }
      })
      
      if (error) {
        console.error('GitHub OAuth 错误:', error)
        throw error
      }
      
    } catch (error) {
      console.error('GitHub 登录失败:', error)
      throw error
    }
  }

  const signOut = async () => {
    if (!mounted) return

    try {
      console.log('开始退出登录...')
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('退出失败:', error)
        throw error
      }
      
      setUser(null)
      
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      console.log('✅ 退出成功')
      
    } catch (error) {
      console.error('退出过程中发生错误:', error)
      // 即使退出失败也要清理本地状态
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
