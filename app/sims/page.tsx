'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { SimStatus } from '@prisma/client'
import StatusBadge from '@/components/badges/StatusBadge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'
import { generateMockSims, generateMockUsageTags, generateMockHistory, MockSim, MockUsageTag, MockSimHistory } from '@/lib/mock-data'
import { FilterState, SummaryStats } from '@/lib/ui-types'
import { formatDate } from '@/lib/utils'

export default function SimsPage() {
  // Mock data
  const [mockSims, setMockSims] = useState<MockSim[]>([])
  const [mockUsageTags, setMockUsageTags] = useState<MockUsageTag[]>([])
  const [simsWithHistory, setSimsWithHistory] = useState<Map<string, MockSimHistory[]>>(new Map())
  const [loading, setLoading] = useState(true)

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    supplier: '',
    serviceName: '',
    usageTags: [],
    search: '',
    dateRange: { start: null, end: null }
  })

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  // Load mock data on mount
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      const sims = generateMockSims(200)
      const tags = generateMockUsageTags()

      // Generate history for each SIM
      const historyMap = new Map<string, MockSimHistory[]>()
      sims.forEach(sim => {
        historyMap.set(sim.iccid, generateMockHistory(sim.iccid, sim.status, sim.currentUsageTagId))
      })

      setMockSims(sims)
      setMockUsageTags(tags)
      setSimsWithHistory(historyMap)
      setLoading(false)
    }, 500)
  }, [])

  // Helper function to check date range overlap
  const isDateRangeOverlapping = (
    simStart: Date,
    simEnd: Date,
    filterStart: Date | null,
    filterEnd: Date | null
  ): boolean => {
    if (!filterStart || !filterEnd) return true
    return simStart <= filterEnd && simEnd >= filterStart
  }

  // Filter SIMs
  const filteredSims = useMemo(() => {
    return mockSims.filter(sim => {
      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(sim.status)) {
        return false
      }

      // Supplier filter
      if (filters.supplier && sim.supplier !== filters.supplier) {
        return false
      }

      // Service name filter
      if (filters.serviceName && sim.currentServiceName !== filters.serviceName) {
        return false
      }

      // Usage tags filter
      if (filters.usageTags.length > 0) {
        if (!sim.currentUsageTagId || !filters.usageTags.includes(sim.currentUsageTagId)) {
          return false
        }
      }

      // Search filter (ICCID, MSISDN, customer ID)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesIccid = sim.iccid.toLowerCase().includes(searchLower)
        const matchesMsisdn = sim.msisdn?.toLowerCase().includes(searchLower)
        const matchesCustomerId = sim.currentCustomerId?.toLowerCase().includes(searchLower)

        if (!matchesIccid && !matchesMsisdn && !matchesCustomerId) {
          return false
        }
      }

      // Date range filter (contract period overlap)
      if (filters.dateRange.start && filters.dateRange.end) {
        const overlaps = isDateRangeOverlapping(
          sim.supplierServiceStartDate,
          sim.supplierServiceEndDate,
          filters.dateRange.start,
          filters.dateRange.end
        )
        if (!overlaps) return false
      }

      return true
    })
  }, [mockSims, filters])

  // Calculate summary stats
  const summaryStats = useMemo((): SummaryStats[] => {
    return mockUsageTags.map(tag => {
      const simsWithTag = filteredSims.filter(s => s.currentUsageTagId === tag.id)
      const availableCount = simsWithTag.filter(s => s.status === 'IN_STOCK').length
      const inUseCount = simsWithTag.filter(s => s.status === 'ACTIVE').length

      return {
        tagId: tag.id,
        tagName: tag.name,
        availableCount,
        totalCount: simsWithTag.length,
        inUseCount
      }
    }).filter(stat => stat.totalCount > 0) // Only show tags with SIMs
  }, [filteredSims, mockUsageTags])

  // Paginate filtered SIMs
  const paginatedSims = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredSims.slice(startIndex, endIndex)
  }, [filteredSims, currentPage, pageSize])

  const totalPages = Math.ceil(filteredSims.length / pageSize)

  // Format date for display (YYYY/MM/DD)
  const formatDateJP = (date: Date | null): string => {
    if (!date) return '-'
    return formatDate(date).replace(/-/g, '/')
  }

  // Get most recent shipping dates from history
  const getMostRecentShippingDates = (iccid: string) => {
    const history = simsWithHistory.get(iccid) || []
    if (history.length === 0) return { shipped: null, arrived: null, returned: null }

    const mostRecent = history[0] // Already sorted by date
    return {
      shipped: mostRecent.shippedDate,
      arrived: mostRecent.arrivedDate,
      returned: mostRecent.returnedDate
    }
  }

  // Get usage tag name by ID
  const getUsageTagName = (tagId: number | null): string => {
    if (!tagId) return '-'
    const tag = mockUsageTags.find(t => t.id === tagId)
    return tag?.name || '-'
  }

  // Handle filter changes
  const handleStatusToggle = (status: SimStatus) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }))
    setCurrentPage(1)
  }

  const handleUsageTagToggle = (tagId: number) => {
    setFilters(prev => ({
      ...prev,
      usageTags: prev.usageTags.includes(tagId)
        ? prev.usageTags.filter(t => t !== tagId)
        : [...prev.usageTags, tagId]
    }))
    setCurrentPage(1)
  }

  const clearAllFilters = () => {
    setFilters({
      status: [],
      supplier: '',
      serviceName: '',
      usageTags: [],
      search: '',
      dateRange: { start: null, end: null }
    })
    setCurrentPage(1)
  }

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.supplier !== '' ||
    filters.serviceName !== '' ||
    filters.usageTags.length > 0 ||
    filters.search !== '' ||
    filters.dateRange.start !== null ||
    filters.dateRange.end !== null

  if (loading) {
    return <LoadingSpinner text="読み込み中..." />
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">スーパー回線一覧</h1>
        <p className="mt-2 text-sm text-gray-600">
          全サービス横断のSIM管理 - 合計 {filteredSims.length} 件
        </p>
      </div>

      {/* Summary Cards */}
      {summaryStats.length > 0 && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryStats.slice(0, 8).map(stat => (
            <div
              key={stat.tagId}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 shadow-sm border border-purple-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-900">{stat.tagName}</span>
                <span className="text-xs text-purple-600">用途タグ</span>
              </div>
              <div className="text-3xl font-bold text-purple-900 mb-1">
                {stat.availableCount}
              </div>
              <div className="text-xs text-purple-700">
                利用可能 / 合計 {stat.totalCount}件 (利用中 {stat.inUseCount}件)
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">フィルター</h2>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              すべてクリア
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Status Filter (Multi-select) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ステータス {filters.status.length > 0 && `(${filters.status.length})`}
            </label>
            <div className="space-y-2">
              {(['IN_STOCK', 'ACTIVE', 'RETURNING', 'RETIRED'] as SimStatus[]).map(status => (
                <label key={status} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(status)}
                    onChange={() => handleStatusToggle(status)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    <StatusBadge status={status} size="sm" />
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Supplier Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              仕入れ先
            </label>
            <select
              value={filters.supplier}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, supplier: e.target.value }))
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              <option value="アーツ">アーツ</option>
              <option value="ソフィア">ソフィア</option>
            </select>
          </div>

          {/* Service Name Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              サービス名
            </label>
            <select
              value={filters.serviceName}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, serviceName: e.target.value }))
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              <option value="物販">物販</option>
              <option value="バーサス">バーサス</option>
              <option value="Avaris">Avaris</option>
            </select>
          </div>

          {/* Usage Tags Filter (Multi-select) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              用途タグ {filters.usageTags.length > 0 && `(${filters.usageTags.length})`}
            </label>
            <div className="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto">
              {mockUsageTags.map(tag => (
                <label key={tag.id} className="flex items-center py-1">
                  <input
                    type="checkbox"
                    checked={filters.usageTags.includes(tag.id)}
                    onChange={() => handleUsageTagToggle(tag.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{tag.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              検索 (ICCID / 電話番号 / 顧客ID)
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, search: e.target.value }))
                setCurrentPage(1)
              }}
              placeholder="検索..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              契約期間
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.dateRange.start ? formatDate(filters.dateRange.start) : ''}
                onChange={(e) => {
                  setFilters(prev => ({
                    ...prev,
                    dateRange: {
                      ...prev.dateRange,
                      start: e.target.value ? new Date(e.target.value) : null
                    }
                  }))
                  setCurrentPage(1)
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="self-center text-gray-500">〜</span>
              <input
                type="date"
                value={filters.dateRange.end ? formatDate(filters.dateRange.end) : ''}
                onChange={(e) => {
                  setFilters(prev => ({
                    ...prev,
                    dateRange: {
                      ...prev.dateRange,
                      end: e.target.value ? new Date(e.target.value) : null
                    }
                  }))
                  setCurrentPage(1)
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredSims.length === 0 ? (
        <EmptyState
          title="SIMが見つかりませんでした"
          description="フィルター条件を変更してください"
          icon="🔍"
        />
      ) : (
        <>
          <div className="bg-white shadow overflow-x-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    ICCID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    電話番号
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    仕入れ先
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    プラン
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    仕入れ先契約期間
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    サービス
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    顧客ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    用途タグ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    顧客契約期間
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    配送状況
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    ステータス
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    最終更新
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedSims.map((sim) => {
                  const shippingDates = getMostRecentShippingDates(sim.iccid)

                  return (
                    <tr key={sim.iccid} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Link
                          href={`/sims/${sim.iccid}`}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          {sim.iccid}
                        </Link>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sim.msisdn || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sim.supplier}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sim.plan}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-600">
                        {formatDateJP(sim.supplierServiceStartDate)} 〜<br />
                        {formatDateJP(sim.supplierServiceEndDate)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sim.currentServiceName || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sim.currentCustomerId || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {sim.currentUsageTagId ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            {getUsageTagName(sim.currentUsageTagId)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-600">
                        {sim.currentContractStartDate && sim.currentContractEndDate ? (
                          <>
                            {formatDateJP(sim.currentContractStartDate)} 〜<br />
                            {formatDateJP(sim.currentContractEndDate)}
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-600">
                        {shippingDates.shipped || shippingDates.arrived || shippingDates.returned ? (
                          <div className="space-y-0.5">
                            {shippingDates.shipped && <div>発送: {formatDateJP(shippingDates.shipped)}</div>}
                            {shippingDates.arrived && <div>到着: {formatDateJP(shippingDates.arrived)}</div>}
                            {shippingDates.returned && <div>返却: {formatDateJP(shippingDates.returned)}</div>}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={sim.status} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                        {formatDateJP(sim.updatedAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                ページ {currentPage} / {totalPages} (全{filteredSims.length}件)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  前へ
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  次へ
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
