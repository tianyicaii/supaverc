import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/router'

export default function Login() {
  const { signInWithGitHub, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // 如果已登录，重定向到仪表板
  if (user) {
    router.push('/dashboard')
    return null
  }

  const handleGitHubLogin = async () => {
    try {
      setLoading(true)
      await signInWithGitHub()
    } catch (error) {
      console.error('Login error:', error)
      alert('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        {/* GitHub 登录按钮 */}
        <button
          onClick={handleGitHubLogin}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 32px',
            fontSize: '18px',
            fontWeight: '600',
            color: 'white',
            background: 'linear-gradient(135deg, #24292e 0%, #1a1e22 100%)',
            border: 'none',
            borderRadius: '50px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            opacity: loading ? 0.7 : 1,
            transform: 'translateY(0)',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(-4px)'
              e.target.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)'
            }
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '24px',
                height: '24px',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                borderTop: '3px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span>登录中...</span>
            </>
          ) : (
            <>
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>使用 GitHub 登录</span>
            </>
          )}
        </button>

        {/* 错误提示 */}
        {router.query.error && (
          <div style={{
            marginTop: '24px',
            padding: '12px 20px',
            backgroundColor: 'rgba(255, 59, 48, 0.1)',
            border: '2px solid rgba(255, 59, 48, 0.3)',
            borderRadius: '12px',
            color: '#ff3b30',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            登录失败，请重试
          </div>
        )}
      </div>

      {/* CSS 动画 */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}