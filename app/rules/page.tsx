'use client'

import { useState, useEffect } from 'react'

interface UsageTag {
  id: number
  name: string
  description: string | null
}

interface UsageRule {
  id: number
  usageTagId: number
  supplierFilter: string | null
  planFilter: string | null
  minContractDays: number
  priority: number
  usageTag: UsageTag
}

export default function RulesPage() {
  const [tags, setTags] = useState<UsageTag[]>([])
  const [rules, setRules] = useState<UsageRule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tagsRes, rulesRes] = await Promise.all([
        fetch('/api/usage-tags'),
        fetch('/api/usage-rules'),
      ])

      const tagsData = await tagsRes.json()
      const rulesData = await rulesRes.json()

      setTags(tagsData.tags || [])
      setRules(rulesData.rules || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">読み込み中...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">ルール管理</h1>
        <p className="mt-2 text-sm text-gray-600">
          用途タグと販売可能判定ルールを管理します
        </p>
      </div>

      {/* Usage Tags */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">用途タグ ({tags.length}件)</h2>
        {tags.length === 0 ? (
          <p className="text-gray-500 text-sm">用途タグがありません</p>
        ) : (
          <div className="space-y-3">
            {tags.map((tag) => (
              <div key={tag.id} className="border border-gray-200 rounded-md p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{tag.name}</h3>
                    {tag.description && (
                      <p className="text-sm text-gray-600 mt-1">{tag.description}</p>
                    )}
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ID: {tag.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage Rules */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">販売可能判定ルール ({rules.length}件)</h2>
        {rules.length === 0 ? (
          <p className="text-gray-500 text-sm">ルールがありません</p>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="border border-gray-200 rounded-md p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {rule.usageTag.name}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">優先度: {rule.priority}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">仕入れ先フィルタ:</span>{' '}
                    <span className="text-gray-900">{rule.supplierFilter || 'すべて'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">プランフィルタ:</span>{' '}
                    <span className="text-gray-900">{rule.planFilter || 'すべて'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">最低契約日数:</span>{' '}
                    <span className="text-gray-900">{rule.minContractDays}日</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> ルールの追加・編集機能は今後の実装予定です。現在はSeedデータで登録されたルールを表示しています。
          </p>
        </div>
      </div>
    </div>
  )
}
