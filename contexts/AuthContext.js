// contexts/AuthContext.js - SSR 优化版本
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

    const getInitialUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          console.error('获取初始用户失败:', error)
        }
        setUser(user)
      } catch (error) {
        console.error('获取用户异常:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 认证状态变化:', event, !!session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [mounted])

  const signInWithGitHub = async () => {
    if (!mounted) return

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

    console.log('🔄 AuthContext: 开始退出登录...')
    
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Supabase signOut 错误:', error)
        throw error
      }
      
      console.log('✅ Supabase signOut 成功')
      
      setUser(null)
      
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      console.log('✅ 本地状态清理完成')
      
    } catch (error) {
      console.error('❌ AuthContext signOut 失败:', error)
      
      setUser(null)
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      throw error
    }
  }

  const value = {
    user,
    loading,
    signInWithGitHub,
    signOut
  }

  // 服务端渲染时不输出调试信息
  if (mounted) {
    console.log('🔍 AuthContext 当前状态:', { hasUser: !!user, loading })
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}