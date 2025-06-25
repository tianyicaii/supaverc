// pages/dashboard.js - 简单调试版本
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/router'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  console.log('Dashboard - user:', user)

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (!user) {
    return <div>正在检查用户状态...</div>
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎉 仪表板 - 登录成功！</h1>
      
      <div style={{ backgroundColor: '#f0f8ff', padding: '15px', margin: '20px 0', borderRadius: '5px' }}>
        <h2>用户信息：</h2>
        <p><strong>邮箱:</strong> {user.email}</p>
        <p><strong>用户ID:</strong> {user.id}</p>
        <p><strong>最后登录:</strong> {user.last_sign_in_at}</p>
        
        {user.user_metadata && (
          <div>
            <h3>GitHub 信息：</h3>
            {user.user_metadata.avatar_url && (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="头像" 
                style={{ width: '50px', height: '50px', borderRadius: '50%' }} 
              />
            )}
            <p><strong>用户名:</strong> {user.user_metadata.user_name}</p>
            <p><strong>姓名:</strong> {user.user_metadata.full_name}</p>
          </div>
        )}
      </div>

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
        退出登录
      </button>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <details>
          <summary>查看完整用户数据</summary>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(user, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}
