'use client'

import { useState, useEffect } from 'react'
import Modal from './Modal'
import { MockUsageTag, MockUsageRule } from '@/lib/mock-data'
import { RuleFormData } from '@/lib/ui-types'

interface RuleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: RuleFormData) => void
  editingRule: MockUsageRule | null
  usageTags: MockUsageTag[]
}

export default function RuleModal({ isOpen, onClose, editingRule, usageTags, onSave }: RuleModalProps) {
  const [formData, setFormData] = useState<RuleFormData>({
    usageTagId: 0,
    supplierFilter: null,
    planFilter: null,
    minContractDays: 0,
    priority: 0
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form when editing or opening
  useEffect(() => {
    if (isOpen) {
      if (editingRule) {
        setFormData({
          usageTagId: editingRule.usageTagId,
          supplierFilter: editingRule.supplierFilter,
          planFilter: editingRule.planFilter,
          minContractDays: editingRule.minContractDays,
          priority: editingRule.priority
        })
      } else {
        // Reset form for new rule
        setFormData({
          usageTagId: 0,
          supplierFilter: null,
          planFilter: null,
          minContractDays: 0,
          priority: 0
        })
      }
      setErrors({})
    }
  }, [isOpen, editingRule])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const newErrors: Record<string, string> = {}

    if (formData.usageTagId === 0) {
      newErrors.usageTagId = '用途タグを選択してください'
    }

    if (formData.minContractDays < 0) {
      newErrors.minContractDays = '0以上の値を入力してください'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSave(formData)
  }

  const handleCancel = () => {
    setFormData({
      usageTagId: 0,
      supplierFilter: null,
      planFilter: null,
      minContractDays: 0,
      priority: 0
    })
    setErrors({})
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={editingRule ? 'ルールを編集' : 'ルールを追加'}
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
          >
            保存
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Usage Tag */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            用途タグ <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.usageTagId}
            onChange={(e) => setFormData({ ...formData, usageTagId: Number(e.target.value) })}
            className={`w-full px-3 py-2 border ${errors.usageTagId ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value={0}>選択してください</option>
            {usageTags.map(tag => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>
          {errors.usageTagId && (
            <p className="mt-1 text-sm text-red-600">{errors.usageTagId}</p>
          )}
        </div>

        {/* Supplier Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            仕入れ先フィルタ
          </label>
          <select
            value={formData.supplierFilter || ''}
            onChange={(e) => setFormData({ ...formData, supplierFilter: e.target.value || null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            <option value="アーツ">アーツ</option>
            <option value="ソフィア">ソフィア</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">特定の仕入れ先のみに適用する場合は選択してください</p>
        </div>

        {/* Plan Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            プランフィルタ
          </label>
          <input
            type="text"
            value={formData.planFilter || ''}
            onChange={(e) => setFormData({ ...formData, planFilter: e.target.value || null })}
            placeholder="例: データ専用プラン"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">特定のプランのみに適用する場合は入力してください</p>
        </div>

        {/* Min Contract Days */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            最低契約日数 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            value={formData.minContractDays}
            onChange={(e) => setFormData({ ...formData, minContractDays: Number(e.target.value) })}
            className={`w-full px-3 py-2 border ${errors.minContractDays ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.minContractDays && (
            <p className="mt-1 text-sm text-red-600">{errors.minContractDays}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">販売可能な最低契約日数を設定します（0 = 制限なし）</p>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            優先度
          </label>
          <input
            type="number"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">数値が大きいほど優先度が高くなります（デフォルト: 0）</p>
        </div>
      </form>
    </Modal>
  )
}
