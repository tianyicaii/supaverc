// pages/dashboard.js - 修复 SSR 错误
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // 确保组件在客户端挂载后才使用 router
  useEffect(() => {
    setMounted(true)
  }, [])

  // 在客户端挂载后才处理重定向
  useEffect(() => {
    if (mounted && !user) {
      router.push('/login')
    }
  }, [mounted, user, router])

  const handleSignOut = async () => {
    if (!mounted) return // 防止服务端执行
    
    console.log('🔄 开始退出登录...')
    
    try {
      console.log('📤 调用 AuthContext signOut...')
      await signOut()
      console.log('✅ AuthContext signOut 成功')
      
      console.log('🔄 执行重定向...')
      router.push('/login')
      
    } catch (error) {
      console.error('❌ 退出失败:', error)
      
      try {
        console.log('🔄 尝试直接退出...')
        await supabase.auth.signOut()
        
        localStorage.clear()
        sessionStorage.clear()
        
        window.location.href = '/login'
      } catch (err) {
        console.error('❌ 直接退出也失败:', err)
        alert('退出失败，请刷新页面重试')
      }
    }
  }

  // 服务端渲染时显示加载状态
  if (!mounted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div>加载中...</div>
      </div>
    )
  }

  // 客户端渲染时检查用户
  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div>正在验证用户...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎉 仪表板</h1>
      
      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', margin: '20px 0', borderRadius: '5px' }}>
        <h3>用户信息：</h3>
        <p><strong>邮箱:</strong> {user.email}</p>
        {user.user_metadata?.avatar_url && (
          <img 
            src={user.user_metadata.avatar_url} 
            alt="头像" 
            style={{ width: '50px', height: '50px', borderRadius: '50%' }} 
          />
        )}
        <p><strong>用户名:</strong> {user.user_metadata?.user_name}</p>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={handleSignOut}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🚪 退出登录
        </button>

        <button 
          onClick={() => console.log('当前用户:', user)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔍 检查状态
        </button>
      </div>
    </div>
  )
}
