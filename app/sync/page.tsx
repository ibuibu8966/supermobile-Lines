'use client'

import { useState, useEffect } from 'react'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { generateMockSyncStatus, generateMockSyncLogs, MockServiceSyncStatus, MockSyncLog } from '@/lib/mock-data'

export default function SyncPage() {
  const [syncStatus, setSyncStatus] = useState<MockServiceSyncStatus[]>([])
  const [syncLogs, setSyncLogs] = useState<MockSyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setSyncStatus(generateMockSyncStatus())
      setSyncLogs(generateMockSyncLogs())
      setLoading(false)
    }, 500)
  }, [])

  const handleSync = async (serviceName?: string) => {
    setSyncing(serviceName || 'all')
    setProgress(0)

    // Animate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)

    await new Promise(resolve => setTimeout(resolve, 2000))

    // Update sync status
    const now = new Date()
    const recordCount = Math.floor(Math.random() * 50) + 10
    const hasError = Math.random() > 0.8 // 20% error rate

    if (serviceName) {
      setSyncStatus(prev => prev.map(s =>
        s.serviceName === serviceName
          ? {
              ...s,
              lastSyncAt: now,
              status: hasError ? 'error' : 'success',
              recordCount: hasError ? 0 : recordCount,
              errorCount: hasError ? Math.floor(Math.random() * 5) + 1 : 0,
              errorMessage: hasError ? 'Connection timeout: Could not reach database' : null
            }
          : s
      ))
    } else {
      setSyncStatus(prev => prev.map(s => ({
        ...s,
        lastSyncAt: now,
        status: Math.random() > 0.8 ? 'error' : 'success',
        recordCount: hasError ? 0 : Math.floor(Math.random() * 50) + 10,
        errorCount: 0,
        errorMessage: null
      })))
    }

    // Add sync log
    const newLog: MockSyncLog = {
      id: syncLogs.length + 1,
      serviceName: serviceName || '全サービス',
      operation: 'Manual Sync',
      status: hasError ? 'error' : 'success',
      recordCount: hasError ? 0 : recordCount,
      errorMessage: hasError ? 'Connection timeout: Could not reach database' : null,
      timestamp: now
    }
    setSyncLogs(prev => [newLog, ...prev])

    setSyncing(null)
    setProgress(0)

    if (hasError) {
      alert(`同期に失敗しました\nサービス: ${serviceName || '全サービス'}\nエラー: Connection timeout`)
    } else {
      alert(`同期が完了しました\nサービス: ${serviceName || '全サービス'}\n更新: ${recordCount}件`)
    }
  }

  const getStatusIcon = (status: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'pending':
        return '⏸️'
    }
  }

  const getStatusColor = (status: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'pending':
        return 'text-gray-400'
    }
  }

  const getStatusLabel = (status: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return '同期済み'
      case 'error':
        return 'エラー'
      case 'pending':
        return '未実行'
    }
  }

  const getRelativeTime = (date: Date | null): string => {
    if (!date) return '-'

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '今'
    if (diffMins < 60) return `${diffMins}分前`
    if (diffHours < 24) return `${diffHours}時間前`
    return `${diffDays}日前`
  }

  const formatTimestamp = (date: Date): string => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  if (loading) {
    return <LoadingSpinner text="読み込み中..." />
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">同期ステータス</h1>
          <p className="mt-2 text-sm text-gray-600">
            外部サービスDBとの同期状況を管理します
          </p>
        </div>
        <button
          onClick={() => handleSync()}
          disabled={syncing !== null}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {syncing === 'all' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              同期中...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              今すぐ同期
            </>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      {syncing && (
        <div className="mb-6 bg-white shadow rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {syncing === 'all' ? '全サービスを同期中...' : `${syncing}を同期中...`}
            </span>
            <span className="text-sm font-medium text-blue-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {syncStatus.map((service) => (
          <div
            key={service.serviceName}
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                  service.status === 'success' ? 'bg-green-500' :
                  service.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                }`}>
                  {service.displayName[0]}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{service.displayName}</h3>
                  <p className="text-xs text-gray-500">{service.serviceName}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">ステータス</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getStatusIcon(service.status)}</span>
                  <span className={`text-sm font-medium ${getStatusColor(service.status)}`}>
                    {getStatusLabel(service.status)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">最終同期</span>
                <span className="text-sm text-gray-900 font-medium">
                  {getRelativeTime(service.lastSyncAt)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">同期件数</span>
                <span className="text-sm text-gray-900 font-medium">{service.recordCount}件</span>
              </div>

              {service.errorCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">エラー</span>
                  <span className="text-sm text-red-600 font-medium">{service.errorCount}件</span>
                </div>
              )}

              {service.errorMessage && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-red-600 break-words">{service.errorMessage}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => handleSync(service.serviceName)}
              disabled={syncing !== null}
              className="mt-4 w-full px-3 py-2 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {syncing === service.serviceName ? '同期中...' : '手動同期'}
            </button>
          </div>
        ))}
      </div>

      {/* Sync History */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">同期履歴</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  サービス
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  件数
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  エラーメッセージ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  タイムスタンプ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {syncLogs.slice(0, 20).map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {log.serviceName}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.operation}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getStatusIcon(log.status)}</span>
                      <span className={`text-sm font-medium ${getStatusColor(log.status)}`}>
                        {log.status === 'success' ? '成功' : '失敗'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.recordCount}件
                  </td>
                  <td className="px-4 py-4 text-sm text-red-600 max-w-xs truncate">
                    {log.errorMessage || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                    {formatTimestamp(log.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {syncLogs.length > 20 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">他 {syncLogs.length - 20} 件の履歴</p>
          </div>
        )}
      </div>

      {/* Configuration Section (Collapsed) */}
      <details className="bg-white shadow rounded-lg p-6">
        <summary className="text-lg font-semibold cursor-pointer hover:text-blue-600 transition-colors">
          接続設定（読み取り専用）
        </summary>

        <div className="mt-4 space-y-4">
          {syncStatus.map((service) => (
            <div key={service.serviceName} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">{service.displayName}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  service.status === 'pending' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'
                }`}>
                  {service.status === 'pending' ? '無効' : '有効'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">接続先:</span>{' '}
                  <span className="text-gray-900 font-mono text-xs">supabase.co/{service.serviceName}</span>
                </div>
                <div>
                  <span className="text-gray-500">テーブル:</span>{' '}
                  <span className="text-gray-900">sims</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
