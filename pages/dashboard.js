import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('github_id', parseInt(user.user_metadata.sub))
          .single()

        if (error) {
          console.error('Error fetching user profile:', error)
        } else {
          setUserProfile(data)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [user, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">用户仪表板</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <img
                  className="h-20 w-20 rounded-full"
                  src={userProfile?.avatar_url || user.user_metadata.avatar_url}
                  alt={userProfile?.name || userProfile?.username}
                />
                <div className="ml-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {userProfile?.name || userProfile?.username}
                  </h2>
                  <p className="text-sm text-gray-500">@{userProfile?.username}</p>
                  {userProfile?.bio && (
                    <p className="mt-1 text-sm text-gray-600">{userProfile.bio}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">邮箱</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userProfile?.email}</dd>
                </div>
                
                {userProfile?.company && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">公司</dt>
                    <dd className="mt-1 text-sm text-gray-900">{userProfile.company}</dd>
                  </div>
                )}

                {userProfile?.location && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">位置</dt>
                    <dd className="mt-1 text-sm text-gray-900">{userProfile.location}</dd>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">公开仓库</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userProfile?.public_repos || 0}</dd>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">关注者</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userProfile?.followers || 0}</dd>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">关注中</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userProfile?.following || 0}</dd>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">上次登录</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {userProfile?.last_login ? new Date(userProfile.last_login).toLocaleString('zh-CN') : '-'}
                  </dd>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">注册时间</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleString('zh-CN') : '-'}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
