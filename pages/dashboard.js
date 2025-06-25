// pages/dashboard.js - 调试版本
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    console.log('🔄 开始退出登录...')
    
    try {
      // 使用 AuthContext 的 signOut
      console.log('📤 调用 AuthContext signOut...')
      await signOut()
      console.log('✅ AuthContext signOut 成功')
      
      // 重定向
      console.log('🔄 执行重定向...')
      router.push('/login')
      
    } catch (error) {
      console.error('❌ 退出失败:', error)
      
      // 备选方案：直接使用 Supabase
      try {
        console.log('🔄 尝试直接退出...')
        await supabase.auth.signOut()
        
        // 清理本地存储
        localStorage.clear()
        sessionStorage.clear()
        
        // 强制跳转
        window.location.href = '/login'
      } catch (err) {
        console.error('❌ 直接退出也失败:', err)
        alert('退出失败，请刷新页面重试')
      }
    }
  }

  if (!user) {
    router.push('/login')
    return null
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

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p>💡 点击退出登录后，请按 F12 查看控制台日志</p>
      </div>
    </div>
  )
}
