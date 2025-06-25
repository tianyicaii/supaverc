// pages/user-manager.js
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function UserManager() {
  const { user } = useAuth()
  const [dbUser, setDbUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  const checkUser = async () => {
    if (!user) return

    setLoading(true)
    setStatus('检查用户记录...')

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        setStatus('❌ 用户记录不存在')
        setDbUser(null)
      } else if (error) {
        setStatus('❌ 查询错误: ' + error.message)
        setDbUser(null)
      } else {
        setStatus('✅ 找到用户记录')
        setDbUser(data)
      }
    } catch (err) {
      setStatus('❌ 异常: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const createUser = async () => {
    if (!user) return

    setLoading(true)
    setStatus('创建用户记录...')

    try {
      const metadata = user.user_metadata || {}

      const userData = {
        auth_user_id: user.id,
        github_id: metadata.provider_id || metadata.sub || `github_${user.id}`,
        username: metadata.user_name || metadata.preferred_username || 'user',
        email: user.email,
        avatar_url: metadata.avatar_url,
        name: metadata.full_name || metadata.name || 'User'
      }

      console.log('创建用户数据:', userData)

      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single()

      if (error) {
        setStatus('❌ 创建失败: ' + error.message)
        console.error('创建错误:', error)
      } else {
        setStatus('✅ 创建成功!')
        setDbUser(data)
        console.log('创建成功:', data)
      }
    } catch (err) {
      setStatus('❌ 创建异常: ' + err.message)
      console.error('创建异常:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      checkUser()
    }
  }, [user])

  if (!user) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>用户管理</h1>
        <p>请先登录</p>
        <a href="/login">去登录</a>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>👤 用户记录管理</h1>

      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', margin: '20px 0', borderRadius: '5px' }}>
        <h3>当前登录用户:</h3>
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>邮箱:</strong> {user.email}</p>
        <p><strong>GitHub 用户名:</strong> {user.user_metadata?.user_name}</p>
        <p><strong>Provider ID:</strong> {user.user_metadata?.provider_id}</p>
      </div>

      <div style={{ 
        backgroundColor: dbUser ? '#d4edda' : '#f8d7da', 
        padding: '15px', 
        margin: '20px 0', 
        borderRadius: '5px' 
      }}>
        <h3>数据库记录状态:</h3>
        <p>{loading ? '⏳ 处理中...' : status}</p>
        
        {dbUser && (
          <div style={{ marginTop: '10px' }}>
            <p><strong>数据库 ID:</strong> {dbUser.id}</p>
            <p><strong>GitHub ID:</strong> {dbUser.github_id}</p>
            <p><strong>用户名:</strong> {dbUser.username}</p>
            <p><strong>创建时间:</strong> {new Date(dbUser.created_at).toLocaleString()}</p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={checkUser}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          🔄 重新检查
        </button>

        <button 
          onClick={createUser}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          ➕ 创建用户记录
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <a href="/dashboard">回到仪表板</a>
      </div>

      <details style={{ marginTop: '20px' }}>
        <summary>查看完整用户数据</summary>
        <pre style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', fontSize: '12px' }}>
          {JSON.stringify(user, null, 2)}
        </pre>
      </details>
    </div>
  )
}
