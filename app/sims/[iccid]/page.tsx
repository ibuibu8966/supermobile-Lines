'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { SimStatus } from '@prisma/client'
import StatusBadge from '@/components/badges/StatusBadge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { generateMockSims, generateMockUsageTags, generateMockHistory, MockSim, MockUsageTag, MockSimHistory } from '@/lib/mock-data'
import { AvailabilityCheckResult } from '@/lib/ui-types'
import { formatDate } from '@/lib/utils'

export default function SimDetailPage({ params }: { params: Promise<{ iccid: string }> }) {
  const { iccid } = use(params)
  const [sim, setSim] = useState<MockSim | null>(null)
  const [history, setHistory] = useState<MockSimHistory[]>([])
  const [usageTags, setUsageTags] = useState<MockUsageTag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // MSISDN manual entry
  const [isEditingMsisdn, setIsEditingMsisdn] = useState(false)
  const [msisdnInput, setMsisdnInput] = useState('')

  // Availability checker
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null)
  const [checkStartDate, setCheckStartDate] = useState('')
  const [checkEndDate, setCheckEndDate] = useState('')
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<AvailabilityCheckResult | null>(null)

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      const allSims = generateMockSims(200)
      const foundSim = allSims.find(s => s.iccid === iccid)

      if (foundSim) {
        setSim(foundSim)
        setHistory(generateMockHistory(foundSim.iccid, foundSim.status, foundSim.currentUsageTagId))
        setUsageTags(generateMockUsageTags())
        setMsisdnInput(foundSim.msisdn || '')
      } else {
        setError('SIMが見つかりませんでした')
      }

      setLoading(false)
    }, 500)
  }, [iccid])

  const formatDateJP = (date: Date | null | string): string => {
    if (!date) return '-'
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return formatDate(dateObj).replace(/-/g, '/')
  }

  const handleSaveMsisdn = () => {
    if (sim) {
      setSim({ ...sim, msisdn: msisdnInput })
      setIsEditingMsisdn(false)
      alert('電話番号を保存しました（モック）')
    }
  }

  const handleCheckAvailability = async () => {
    if (!selectedTagId || !checkStartDate || !checkEndDate) {
      alert('用途タグと日付を選択してください')
      return
    }

    setChecking(true)
    setCheckResult(null)

    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 800))

    // Mock logic: 70% success rate
    const canSell = Math.random() > 0.3

    if (canSell) {
      setCheckResult({
        available: true,
        message: 'この期間で販売可能です',
        reason: null,
        availableCount: Math.floor(Math.random() * 20) + 5
      })
    } else {
      const reasons = [
        '最低契約日数30日が必要です (選択期間: 15日)',
        '仕入れ先契約期間外です',
        'このプランは選択用途に対応していません',
        'この期間は既に別の契約が入っています'
      ]
      setCheckResult({
        available: false,
        message: '販売できません',
        reason: reasons[Math.floor(Math.random() * reasons.length)]
      })
    }

    setChecking(false)
  }

  const getUsageTagName = (tagId: number | null): string => {
    if (!tagId) return '-'
    const tag = usageTags.find(t => t.id === tagId)
    return tag?.name || '-'
  }

  const handleMockAction = (action: string) => {
    alert(`${action}機能は開発中です（モック）`)
  }

  if (loading) {
    return <LoadingSpinner text="読み込み中..." />
  }

  if (error || !sim) {
    return (
      <div>
        <Link href="/sims" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← SIM一覧に戻る
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
          {error || 'データが見つかりませんでした'}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <Link href="/sims" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
        ← SIM一覧に戻る
      </Link>

      {/* Header with Actions */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SIM詳細</h1>
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-600">ICCID: {sim.iccid}</p>
            <StatusBadge status={sim.status} />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleMockAction('編集')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
          >
            編集
          </button>
          {sim.status === 'ACTIVE' && (
            <button
              onClick={() => handleMockAction('在庫に戻す')}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium transition-colors"
            >
              在庫に戻す
            </button>
          )}
          <button
            onClick={() => handleMockAction('用途を変更')}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium transition-colors"
          >
            用途を変更
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Basic Info Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">基本情報</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">電話番号 (MSISDN)</label>
              {isEditingMsisdn ? (
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={msisdnInput}
                    onChange={(e) => setMsisdnInput(e.target.value)}
                    placeholder="電話番号を入力"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSaveMsisdn}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingMsisdn(false)
                      setMsisdnInput(sim.msisdn || '')
                    }}
                    className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm font-medium"
                  >
                    キャンセル
                  </button>
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm text-gray-900">{sim.msisdn || '未登録'}</p>
                  <button
                    onClick={() => setIsEditingMsisdn(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {sim.msisdn ? '✏️ 編集' : '+ 手動で追加'}
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">仕入れ先</label>
              <p className="mt-1 text-sm text-gray-900">{sim.supplier}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">所有会社</label>
              <p className="mt-1 text-sm text-gray-900">{sim.ownerCompany}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">プラン</label>
              <p className="mt-1 text-sm text-gray-900">{sim.plan}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">顧客タイプ</label>
              <p className="mt-1 text-sm text-gray-900">{sim.customerType}</p>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-500 mb-2">仕入れ先契約期間</label>
              <p className="text-sm text-gray-900">
                {formatDateJP(sim.supplierServiceStartDate)} 〜 {formatDateJP(sim.supplierServiceEndDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Current Assignment Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">現在の割当</h2>
          {sim.currentServiceName ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">サービス名</label>
                <p className="mt-1 text-sm text-gray-900">{sim.currentServiceName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">顧客ID</label>
                <p className="mt-1 text-sm text-gray-900">{sim.currentCustomerId || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">用途タグ</label>
                {sim.currentUsageTagId ? (
                  <span className="mt-1 inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                    {getUsageTagName(sim.currentUsageTagId)}
                  </span>
                ) : (
                  <p className="mt-1 text-sm text-gray-400">-</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">顧客契約期間</label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDateJP(sim.currentContractStartDate)} 〜 {formatDateJP(sim.currentContractEndDate)}
                </p>
              </div>
              {history.length > 0 && history[0].shippedDate && (
                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-500 mb-2">配送状況</label>
                  <div className="space-y-1 text-sm">
                    {history[0].shippedDate && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">発送:</span>
                        <span className="text-gray-900">{formatDateJP(history[0].shippedDate)}</span>
                      </div>
                    )}
                    {history[0].arrivedDate && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">到着:</span>
                        <span className="text-gray-900">{formatDateJP(history[0].arrivedDate)}</span>
                      </div>
                    )}
                    {history[0].returnedDate && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">返却:</span>
                        <span className="text-gray-900">{formatDateJP(history[0].returnedDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">現在割当なし</p>
              <p className="text-xs">在庫状態です</p>
            </div>
          )}
        </div>
      </div>

      {/* Availability Checker */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">販売可能性チェック</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              用途タグ
            </label>
            <select
              value={selectedTagId || ''}
              onChange={(e) => setSelectedTagId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">選択してください</option>
              {usageTags.map(tag => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              契約開始日
            </label>
            <input
              type="date"
              value={checkStartDate}
              onChange={(e) => setCheckStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              契約終了日
            </label>
            <input
              type="date"
              value={checkEndDate}
              onChange={(e) => setCheckEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleCheckAvailability}
              disabled={checking}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {checking ? 'チェック中...' : 'チェック'}
            </button>
          </div>
        </div>

        {/* Check Result */}
        {checkResult && (
          <div className={`mt-4 rounded-lg p-4 ${checkResult.available ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{checkResult.available ? '✅' : '❌'}</span>
              <div className="flex-1">
                <p className={`font-medium ${checkResult.available ? 'text-green-900' : 'text-red-900'}`}>
                  {checkResult.message}
                  {checkResult.availableCount && ` (${checkResult.availableCount}件の在庫)`}
                </p>
                {checkResult.reason && (
                  <p className="text-sm text-red-800 mt-1">{checkResult.reason}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History Timeline */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">履歴タイムライン ({history.length}件)</h2>
        {history.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">履歴がありません</p>
        ) : (
          <div className="space-y-6">
            {history.map((record, index) => (
              <div key={record.id} className="relative">
                {/* Timeline connector */}
                {index < history.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200" />
                )}

                <div className="flex gap-4">
                  {/* Date badge */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold z-10 relative">
                      {index + 1}
                    </div>
                  </div>

                  {/* Content card */}
                  <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {record.serviceName}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {getUsageTagName(record.usageTagId)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDateJP(record.createdAt)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      <div>
                        <span className="text-gray-500">顧客ID:</span>{' '}
                        <span className="text-gray-900 font-medium">{record.customerId}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">電話番号:</span>{' '}
                        <span className="text-gray-900">{record.msisdnSnapshot || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">契約期間:</span>{' '}
                        <span className="text-gray-900">
                          {formatDateJP(record.contractStartDate)} 〜 {formatDateJP(record.contractEndDate)}
                        </span>
                      </div>
                    </div>

                    {/* Shipping timeline */}
                    {(record.shippedDate || record.arrivedDate || record.returnedDate) && (
                      <div className="pt-3 border-t border-gray-300">
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <span className={record.shippedDate ? 'text-blue-600' : 'text-gray-400'}>📦</span>
                            <span className={record.shippedDate ? 'text-gray-900' : 'text-gray-400'}>
                              発送 {record.shippedDate ? formatDateJP(record.shippedDate) : '-'}
                            </span>
                          </div>
                          <span className="text-gray-400">→</span>
                          <div className="flex items-center gap-1">
                            <span className={record.arrivedDate ? 'text-green-600' : 'text-gray-400'}>📍</span>
                            <span className={record.arrivedDate ? 'text-gray-900' : 'text-gray-400'}>
                              到着 {record.arrivedDate ? formatDateJP(record.arrivedDate) : '-'}
                            </span>
                          </div>
                          <span className="text-gray-400">→</span>
                          <div className="flex items-center gap-1">
                            <span className={record.returnedDate ? 'text-purple-600' : 'text-gray-400'}>🔙</span>
                            <span className={record.returnedDate ? 'text-gray-900' : 'text-gray-400'}>
                              返却 {record.returnedDate ? formatDateJP(record.returnedDate) : '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
