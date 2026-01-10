'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { Sim, SimHistory, SimStatus } from '@prisma/client'
import { formatDate } from '@/lib/utils'

interface SimDetailResponse {
  sim: Sim
  history: Array<SimHistory & { usageTag?: { id: number; name: string } | null }>
}

export default function SimDetailPage({ params }: { params: Promise<{ iccid: string }> }) {
  const { iccid } = use(params)
  const [data, setData] = useState<SimDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSimDetail = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/sims/${iccid}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('SIMが見つかりませんでした')
          }
          throw new Error('SIM情報の取得に失敗しました')
        }

        const result: SimDetailResponse = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    fetchSimDetail()
  }, [iccid])

  const getStatusLabel = (status: SimStatus) => {
    switch (status) {
      case 'IN_STOCK': return '在庫'
      case 'ACTIVE': return '利用中'
      case 'RETURNING': return '返却待ち'
      case 'RETIRED': return '廃棄'
      default: return status
    }
  }

  const getStatusColor = (status: SimStatus) => {
    switch (status) {
      case 'IN_STOCK': return 'bg-green-100 text-green-800'
      case 'ACTIVE': return 'bg-blue-100 text-blue-800'
      case 'RETURNING': return 'bg-yellow-100 text-yellow-800'
      case 'RETIRED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
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

  if (error || !data) {
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

  const { sim, history } = data

  return (
    <div>
      <Link href="/sims" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
        ← SIM一覧に戻る
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">SIM詳細</h1>
        <p className="mt-2 text-sm text-gray-600">ICCID: {sim.iccid}</p>
      </div>

      {/* SIM Basic Info */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">基本情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">ICCID</label>
            <p className="mt-1 text-sm text-gray-900">{sim.iccid}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">電話番号 (MSISDN)</label>
            <p className="mt-1 text-sm text-gray-900">{sim.msisdn || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">仕入れ先</label>
            <p className="mt-1 text-sm text-gray-900">{sim.supplier}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">ステータス</label>
            <span className={`mt-1 inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${getStatusColor(sim.status)}`}>
              {getStatusLabel(sim.status)}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">所有会社</label>
            <p className="mt-1 text-sm text-gray-900">{sim.ownerCompany || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">プラン</label>
            <p className="mt-1 text-sm text-gray-900">{sim.plan || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">顧客タイプ</label>
            <p className="mt-1 text-sm text-gray-900">{sim.customerType || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">現在のサービス</label>
            <p className="mt-1 text-sm text-gray-900">{sim.currentServiceName || '-'}</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium mb-3">仕入れ先契約期間</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">サービス開始日</label>
              <p className="mt-1 text-sm text-gray-900">
                {sim.supplierServiceStartDate ? formatDate(sim.supplierServiceStartDate) : '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">サービス終了日</label>
              <p className="mt-1 text-sm text-gray-900">
                {sim.supplierServiceEndDate ? formatDate(sim.supplierServiceEndDate) : '-'}
              </p>
            </div>
          </div>
        </div>

        {sim.currentCustomerId && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium mb-3">現在の割当</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">顧客ID</label>
                <p className="mt-1 text-sm text-gray-900">{sim.currentCustomerId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">契約開始日</label>
                <p className="mt-1 text-sm text-gray-900">
                  {sim.currentContractStartDate ? formatDate(sim.currentContractStartDate) : '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">契約終了日</label>
                <p className="mt-1 text-sm text-gray-900">
                  {sim.currentContractEndDate ? formatDate(sim.currentContractEndDate) : '-'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">履歴 ({history.length}件)</h2>
        {history.length === 0 ? (
          <p className="text-gray-500 text-sm">履歴がありません</p>
        ) : (
          <div className="space-y-4">
            {history.map((record) => (
              <div key={record.id} className="border border-gray-200 rounded-md p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {record.serviceName}
                    </span>
                    {record.usageTag && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {record.usageTag.name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    登録日: {formatDate(record.createdAt)}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">顧客ID:</span>{' '}
                    <span className="text-gray-900">{record.customerId || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">電話番号:</span>{' '}
                    <span className="text-gray-900">{record.msisdnSnapshot || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">契約開始:</span>{' '}
                    <span className="text-gray-900">
                      {record.contractStartDate ? formatDate(record.contractStartDate) : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">契約終了:</span>{' '}
                    <span className="text-gray-900">
                      {record.contractEndDate ? formatDate(record.contractEndDate) : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">発送日:</span>{' '}
                    <span className="text-gray-900">
                      {record.shippedDate ? formatDate(record.shippedDate) : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">到着日:</span>{' '}
                    <span className="text-gray-900">
                      {record.arrivedDate ? formatDate(record.arrivedDate) : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">返却日:</span>{' '}
                    <span className="text-gray-900">
                      {record.returnedDate ? formatDate(record.returnedDate) : '-'}
                    </span>
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
