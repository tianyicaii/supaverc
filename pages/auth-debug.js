// pages/auth-debug.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function AuthDebug() {
  const { user, loading } = useAuth()
  const [sessionInfo, setSessionInfo] = useState(null)
  const [error, setError] = useState(null)

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        setError(error.message)
        setSessionInfo(null)
      } else {
        setError(null)
        setSessionInfo(session)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const testSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        alert('退出失败: ' + error.message)
      } else {
        alert('退出成功')
        checkSession()
      }
    } catch (err) {
      alert('退出异常: ' + err.message)
    }
  }

  useEffect(() => {
    checkSession()
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔍 认证状态调试</h1>

      <div style={{ marginBottom: '20px' }}>
        <h3>AuthContext 状态:</h3>
        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
          <p><strong>Loading:</strong> {loading ? '是' : '否'}</p>
          <p><strong>User:</strong> {user ? `${user.email} (${user.id})` : '无'}</p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>直接会话检查:</h3>
        <div style={{ 
          backgroundColor: error ? '#f8d7da' : sessionInfo ? '#d4edda' : '#fff3cd', 
          padding: '15px', 
          borderRadius: '5px' 
        }}>
          {error ? (
            <p style={{ color: '#721c24' }}>❌ 错误: {error}</p>
          ) : sessionInfo ? (
            <div>
              <p style={{ color: '#155724' }}>✅ 会话存在</p>
              <p><strong>用户:</strong> {sessionInfo.user.email}</p>
              <p><strong>过期时间:</strong> {new Date(sessionInfo.expires_at * 1000).toLocaleString()}</p>
            </div>
          ) : (
            <p style={{ color: '#856404' }}>⚠️ 无会话</p>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>环境信息:</h3>
        <div style={{ backgroundColor: '#e7f3ff', padding: '15px', borderRadius: '5px' }}>
          <p><strong>当前域名:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
          <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || '未设置'}</p>
          <p><strong>Anon Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已设置' : '未设置'}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={checkSession}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔄 重新检查会话
        </button>

        <button 
          onClick={testSignOut}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🚪 测试退出
        </button>

        <a 
          href="/login"
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            display: 'inline-block'
          }}
        >
          🔑 去登录页
        </a>
      </div>

      {sessionInfo && (
        <details style={{ marginTop: '20px' }}>
          <summary>完整会话信息</summary>
          <pre style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '5px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}