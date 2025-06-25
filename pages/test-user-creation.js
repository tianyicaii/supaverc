// pages/test-user-creation.js
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function TestUserCreation() {
  const { user } = useAuth()
  const [userRecord, setUserRecord] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const checkUserExists = async () => {
    if (!user) return

    setLoading(true)
    setMessage('检查用户记录...')

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setMessage('❌ 用户记录不存在')
          setUserRecord(null)
        } else {
          setMessage('❌ 查询错误: ' + error.message)
        }
      } else {
        setMessage('✅ 找到用户记录')
        setUserRecord(data)
      }
    } catch (err) {
      setMessage('❌ 查询异常: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const createUserManually = async () => {
    if (!user) return

    setLoading(true)
    setMessage('手动创建用户记录...')

    try {
      const metadata = user.user_metadata || {}
      
      const userData = {
        auth_user_id: user.id,
        github_id: parseInt(metadata.provider_id || metadata.sub || Date.now()),
        username: metadata.user_name || 'testuser',
        email: user.email,
        avatar_url: metadata.avatar_url,
        name: metadata.full_name || metadata.name
      }

      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()

      if (error) {
        setMessage('❌ 创建失败: ' + error.message)
      } else {
        setMessage('✅ 创建成功!')
        setUserRecord(data[0])
      }
    } catch (err) {
      setMessage('❌ 创建异常: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      checkUserExists()
    }
  }, [user])

  if (!user) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>用户创建测试</h1>
        <p>请先登录</p>
        <a href="/login">去登录</a>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 用户创建测试</h1>

      <div style={{ marginBottom: '20px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
        <h3>认证用户信息:</h3>
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>邮箱:</strong> {user.email}</p>
        <p><strong>GitHub 用户名:</strong> {user.user_metadata?.user_name}</p>
        <p><strong>Provider ID:</strong> {user.user_metadata?.provider_id}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>状态:</h3>
        <div style={{ 
          padding: '10px', 
          backgroundColor: loading ? '#fff3cd' : userRecord ? '#d4edda' : '#f8d7da',
          borderRadius: '5px'
        }}>
          {message}
        </div>
      </div>

      {userRecord && (
        <div style={{ marginBottom: '20px', backgroundColor: '#e7f3ff', padding: '15px', borderRadius: '5px' }}>
          <h3>数据库记录:</h3>
          <p><strong>数据库 ID:</strong> {userRecord.id}</p>
          <p><strong>GitHub ID:</strong> {userRecord.github_id}</p>
          <p><strong>用户名:</strong> {userRecord.username}</p>
          <p><strong>创建时间:</strong> {new Date(userRecord.created_at).toLocaleString()}</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={checkUserExists}
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

        {!userRecord && (
          <button 
            onClick={createUserManually}
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
            ➕ 手动创建
          </button>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <a href="/dashboard">回到仪表板</a>
      </div>
    </div>
  )
}