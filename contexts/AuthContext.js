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
    // 获取初始用户状态
    const getInitialUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getInitialUser()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)

        // 当用户登录时，创建或更新用户信息
        if (event === 'SIGNED_IN' && session?.user) {
          await createOrUpdateUser(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const createOrUpdateUser = async (authUser) => {
    try {
      // 从 GitHub 获取用户详细信息
      const githubUser = authUser.user_metadata

      const userData = {
        github_id: parseInt(githubUser.sub) || parseInt(authUser.id.split('-')[0], 16),
        username: githubUser.user_name || githubUser.preferred_username,
        email: authUser.email,
        avatar_url: githubUser.avatar_url,
        name: githubUser.full_name || githubUser.name,
        bio: githubUser.bio,
        company: githubUser.company,
        location: githubUser.location,
        blog: githubUser.blog,
        twitter_username: githubUser.twitter_username,
        public_repos: githubUser.public_repos,
        followers: githubUser.followers,
        following: githubUser.following,
        last_login: new Date().toISOString()
      }

      // 尝试插入或更新用户
      const { error } = await supabase
        .from('users')
        .upsert(userData, { 
          onConflict: 'github_id',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error('Error creating/updating user:', error)
      }
    } catch (error) {
      console.error('Error in createOrUpdateUser:', error)
    }
  }

  const signInWithGitHub = async () => {
    try {
      // 动态确定回调 URL - 本地开发时使用 localhost
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : 'http://localhost:3001'
      
      console.log('使用回调 URL:', `${baseUrl}/auth/callback`)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          scopes: 'read:user user:email',
          redirectTo: `${baseUrl}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('GitHub 登录错误:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
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