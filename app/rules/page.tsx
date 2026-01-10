'use client'

import { useState, useEffect } from 'react'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import RuleModal from '@/components/modals/RuleModal'
import { generateMockUsageTags, generateMockUsageRules, MockUsageTag, MockUsageRule } from '@/lib/mock-data'
import { RuleFormData } from '@/lib/ui-types'

export default function RulesPage() {
  const [tags, setTags] = useState<MockUsageTag[]>([])
  const [rules, setRules] = useState<MockUsageRule[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<MockUsageRule | null>(null)

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      const mockTags = generateMockUsageTags()
      const mockRules = generateMockUsageRules()
      setTags(mockTags)
      setRules(mockRules)
      setLoading(false)
    }, 500)
  }, [])

  const handleAddRule = () => {
    setEditingRule(null)
    setIsModalOpen(true)
  }

  const handleEditRule = (rule: MockUsageRule) => {
    setEditingRule(rule)
    setIsModalOpen(true)
  }

  const handleDeleteRule = (ruleId: number) => {
    const rule = rules.find(r => r.id === ruleId)
    if (rule && confirm(`「${rule.usageTag.name}」のルールを削除してもよろしいですか？`)) {
      setRules(prev => prev.filter(r => r.id !== ruleId))
      alert('ルールを削除しました（モック）')
    }
  }

  const handleSaveRule = (data: RuleFormData) => {
    if (editingRule) {
      // Update existing rule
      setRules(prev => prev.map(rule => {
        if (rule.id === editingRule.id) {
          const usageTag = tags.find(t => t.id === data.usageTagId)!
          return {
            ...rule,
            usageTagId: data.usageTagId,
            usageTag,
            supplierFilter: data.supplierFilter,
            planFilter: data.planFilter,
            minContractDays: data.minContractDays,
            priority: data.priority
          }
        }
        return rule
      }))
      alert('ルールを更新しました（モック）')
    } else {
      // Add new rule
      const usageTag = tags.find(t => t.id === data.usageTagId)!
      const newRule: MockUsageRule = {
        id: Math.max(...rules.map(r => r.id), 0) + 1,
        usageTagId: data.usageTagId,
        usageTag,
        supplierFilter: data.supplierFilter,
        planFilter: data.planFilter,
        minContractDays: data.minContractDays,
        priority: data.priority,
        conditions: {},
        createdAt: new Date()
      }
      setRules(prev => [...prev, newRule])
      alert('ルールを追加しました（モック）')
    }

    setIsModalOpen(false)
    setEditingRule(null)
  }

  // Find tags without rules
  const tagsWithoutRules = tags.filter(tag =>
    !rules.some(rule => rule.usageTagId === tag.id)
  )

  if (loading) {
    return <LoadingSpinner text="読み込み中..." />
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">ルール管理</h1>
        <p className="mt-2 text-sm text-gray-600">
          用途タグと販売可能判定ルールを管理します
        </p>
      </div>

      {/* Warning for tags without rules */}
      {tagsWithoutRules.length > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="font-medium text-yellow-900 mb-2">
                以下の用途タグにルールが設定されていません:
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-800 mb-3">
                {tagsWithoutRules.map(tag => (
                  <li key={tag.id}>{tag.name}</li>
                ))}
              </ul>
              <p className="text-sm text-yellow-800">
                販売可能判定を行うためには、各用途タグにルールを設定してください。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Usage Tags */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">用途タグ ({tags.length}件)</h2>
        {tags.length === 0 ? (
          <p className="text-gray-500 text-sm">用途タグがありません</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tags.map((tag) => (
              <div key={tag.id} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <div className="flex items-start justify-between mb-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-600 text-white">
                    {tag.name}
                  </span>
                  <span className="text-xs text-purple-600">ID: {tag.id}</span>
                </div>
                {tag.description && (
                  <p className="text-sm text-purple-900 mt-2">{tag.description}</p>
                )}
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <span className="text-xs text-purple-700">
                    ルール: {rules.filter(r => r.usageTagId === tag.id).length}件
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage Rules */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">販売可能判定ルール ({rules.length}件)</h2>
          <button
            onClick={handleAddRule}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            ルールを追加
          </button>
        </div>

        {rules.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4">ルールがまだ設定されていません</p>
            <button
              onClick={handleAddRule}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              最初のルールを追加
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {rules
              .sort((a, b) => b.priority - a.priority) // Sort by priority descending
              .map((rule) => (
                <div
                  key={rule.id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow relative"
                >
                  {/* Action buttons */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => handleEditRule(rule)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="編集"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="削除"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Rule content */}
                  <div className="flex items-center gap-3 mb-4 pr-20">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      {rule.usageTag.name}
                    </span>
                    {rule.priority > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        優先度: {rule.priority}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 font-medium">仕入れ先:</span>{' '}
                      <span className="text-gray-900">{rule.supplierFilter || 'すべて'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">プラン:</span>{' '}
                      <span className="text-gray-900">{rule.planFilter || 'すべて'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">最低契約日数:</span>{' '}
                      <span className="text-gray-900 font-semibold">{rule.minContractDays}日</span>
                    </div>
                  </div>

                  {(rule.supplierFilter || rule.planFilter || rule.minContractDays > 0) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">適用条件:</span>{' '}
                        {[
                          rule.supplierFilter && `仕入れ先が${rule.supplierFilter}`,
                          rule.planFilter && `プランが${rule.planFilter}`,
                          rule.minContractDays > 0 && `契約期間が${rule.minContractDays}日以上`
                        ].filter(Boolean).join('、')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Rule Modal */}
      <RuleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingRule(null)
        }}
        onSave={handleSaveRule}
        editingRule={editingRule}
        usageTags={tags}
      />
    </div>
  )
}
