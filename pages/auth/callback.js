// pages/auth/callback.js - 修复会话处理
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState('正在处理认证...')
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('🔄 解析认证信息...')
        
        // 检查 URL 中是否有错误
        const { error: urlError } = router.query
        if (urlError) {
          setError('认证失败: ' + urlError)
          setTimeout(() => router.push('/login?error=' + urlError), 2000)
          return
        }

        // 方法1：处理 hash fragment 中的 token（新版本）
        if (window.location.hash) {
          setStatus('🔑 检测到认证令牌，处理中...')
          
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          
          if (accessToken) {
            console.log('从 hash 中获取到 token')
            
            // 使用 setSession 方法设置会话
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            
            if (sessionError) {
              console.error('设置会话失败:', sessionError)
              setError('会话设置失败: ' + sessionError.message)
              setTimeout(() => router.push('/login?error=session_failed'), 2000)
              return
            }
            
            if (data.session) {
              setStatus('✅ 登录成功！正在跳转...')
              console.log('会话设置成功:', data.session.user.email)
              setTimeout(() => router.push('/dashboard'), 1000)
              return
            }
          }
        }

        // 方法2：检查现有会话
        setStatus('🔍 检查现有会话...')
        const { data: { session }, error: getSessionError } = await supabase.auth.getSession()
        
        if (getSessionError) {
          console.error('获取会话失败:', getSessionError)
          setError('获取会话失败: ' + getSessionError.message)
          setTimeout(() => router.push('/login?error=get_session_failed'), 2000)
          return
        }

        if (session && session.user) {
          setStatus('✅ 找到有效会话！正在跳转...')
          setTimeout(() => router.push('/dashboard'), 1000)
          return
        }

        // 方法3：等待认证状态变化
        setStatus('⏳ 等待认证完成...')
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('认证状态变化:', event, !!session)
          
          if (event === 'SIGNED_IN' && session) {
            setStatus('✅ 认证完成！正在跳转...')
            subscription.unsubscribe()
            setTimeout(() => router.push('/dashboard'), 1000)
          } else if (event === 'SIGNED_OUT') {
            setError('认证失败，已退出')
            subscription.unsubscribe()
            setTimeout(() => router.push('/login?error=signed_out'), 2000)
          }
        })

        // 5秒后如果还没有认证成功，重定向到登录页
        setTimeout(() => {
          subscription.unsubscribe()
          if (!error) {
            setError('认证超时')
            router.push('/login?error=timeout')
          }
        }, 5000)

      } catch (err) {
        console.error('回调处理异常:', err)
        setError('处理异常: ' + err.message)
        setTimeout(() => router.push('/login?error=callback_exception'), 2000)
      }
    }

    // 延迟执行，确保 router 就绪
    const timer = setTimeout(handleAuthCallback, 200)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        {!error ? (
          <>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <h2 style={{ color: '#333', marginBottom: '0.5rem' }}>处理登录</h2>
            <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>{status}</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '48px', marginBottom: '1rem' }}>❌</div>
            <h2 style={{ color: '#dc3545', marginBottom: '0.5rem' }}>认证失败</h2>
            <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>{error}</p>
          </>
        )}
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
      
      <div style={{ 
        marginTop: '1rem', 
        fontSize: '0.8rem', 
        color: '#888',
        textAlign: 'center'
      }}>
        <a href="/login" style={{color: '#007bff', textDecoration: 'none'}}>
          重新登录
        </a>
        {' | '}
        <a href="/" style={{color: '#007bff', textDecoration: 'none'}}>
          返回首页
        </a>
      </div>
    </div>
  )
}
