// pages/verify-user-creation.js
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function VerifyUserCreation() {
  const { user } = useAuth()
  const [userRecord, setUserRecord] = useState(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState([])

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const checkUserRecord = async () => {
    if (!user) {
      addLog('❌ 没有登录用户')
      return
    }

    setLoading(true)
    addLog('🔍 检查用户记录...')

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        addLog('❌ 用户记录不存在')
        setUserRecord(null)
      } else if (error) {
        addLog('❌ 查询错误: ' + error.message)
        setUserRecord(null)
      } else {
        addLog('✅ 找到用户记录!')
        addLog(`📝 用户名: ${data.username}`)
        addLog(`📝 GitHub ID: ${data.github_id}`)
        addLog(`📝 创建时间: ${new Date(data.created_at).toLocaleString()}`)
        setUserRecord(data)
      }
    } catch (err) {
      addLog('❌ 异常: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const testTrigger = async () => {
    if (!user) return

    setLoading(true)
    addLog('🧪 测试触发器（模拟重新登录）...')

    try {
      // 退出登录
      await supabase.auth.signOut()
      addLog('🚪 已退出登录')
      
      // 等待一秒
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 重新登录
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        addLog('❌ 重新登录失败: ' + error.message)
      } else {
        addLog('🔑 重新登录中...')
      }
    } catch (err) {
      addLog('❌ 测试异常: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const manualCreate = async () => {
    if (!user) return

    setLoading(true)
    addLog('➕ 手动创建用户记录...')

    try {
      const metadata = user.user_metadata || {}
      
      const userData = {
        auth_user_id: user.id,
        github_id: parseInt(metadata.provider_id || metadata.sub || Date.now()),
        username: metadata.user_name || metadata.preferred_username || 'user',
        email: user.email,
        avatar_url: metadata.avatar_url,
        name: metadata.full_name || metadata.name
      }

      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single()

      if (error) {
        addLog('❌ 手动创建失败: ' + error.message)
      } else {
        addLog('✅ 手动创建成功!')
        setUserRecord(data)
      }
    } catch (err) {
      addLog('❌ 手动创建异常: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      addLog('👤 检测到登录用户: ' + user.email)
      checkUserRecord()
    }
  }, [user])

  if (!user) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>验证用户创建</h1>
        <p>请先登录以测试用户记录创建</p>
        <a href="/login" style={{ color: '#007bff' }}>去登录</a>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔍 验证用户记录创建</h1>

      {/* 用户信息 */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', margin: '20px 0', borderRadius: '5px' }}>
        <h3>当前用户信息:</h3>
        <p><strong>邮箱:</strong> {user.email}</p>
        <p><strong>用户ID:</strong> {user.id}</p>
        <p><strong>GitHub用户名:</strong> {user.user_metadata?.user_name}</p>
        <p><strong>Provider ID:</strong> {user.user_metadata?.provider_id}</p>
      </div>

      {/* 数据库记录状态 */}
      <div style={{ 
        backgroundColor: userRecord ? '#d4edda' : '#f8d7da', 
        padding: '15px', 
        margin: '20px 0', 
        borderRadius: '5px' 
      }}>
        <h3>数据库记录状态:</h3>
        {userRecord ? (
          <div>
            <p>✅ 用户记录存在</p>
            <p><strong>用户名:</strong> {userRecord.username}</p>
            <p><strong>GitHub ID:</strong> {userRecord.github_id}</p>
            <p><strong>创建时间:</strong> {new Date(userRecord.created_at).toLocaleString()}</p>
            <p><strong>最后登录:</strong> {new Date(userRecord.last_login).toLocaleString()}</p>
          </div>
        ) : (
          <p>❌ 用户记录不存在</p>
        )}
      </div>

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={checkUserRecord}
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
          onClick={manualCreate}
          disabled={loading || userRecord}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: (loading || userRecord) ? 'not-allowed' : 'pointer'
          }}
        >
          ➕ 手动创建
        </button>

        <button 
          onClick={testTrigger}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          🧪 测试触发器
        </button>
      </div>

      {/* 日志 */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '5px',
        maxHeight: '300px',
        overflow: 'auto'
      }}>
        <h3>操作日志:</h3>
        {logs.length === 0 ? (
          <p>暂无日志</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ fontSize: '14px', marginBottom: '5px' }}>
              {log}
            </div>
          ))
        )}
      </div>

      {/* 导航 */}
      <div style={{ marginTop: '20px' }}>
        <a href="/dashboard" style={{ color: '#007bff', marginRight: '20px' }}>回到仪表板</a>
        <a href="/logout" style={{ color: '#dc3545' }}>退出登录</a>
      </div>
    </div>
  )
}
