// contexts/AuthContext.js - 修复版本
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

  useEffect(() => {
    // 获取初始用户
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

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 认证状态变化:', event, !!session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGitHub = async () => {
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
    console.log('🔄 AuthContext: 开始退出登录...')
    
    try {
      // 调用 Supabase signOut
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Supabase signOut 错误:', error)
        throw error
      }
      
      console.log('✅ Supabase signOut 成功')
      
      // 手动清理状态（防止状态更新延迟）
      setUser(null)
      
      // 清理本地存储
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      console.log('✅ 本地状态清理完成')
      
    } catch (error) {
      console.error('❌ AuthContext signOut 失败:', error)
      
      // 即使 signOut 失败，也要清理本地状态
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

  console.log('🔍 AuthContext 当前状态:', { hasUser: !!user, loading })

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}