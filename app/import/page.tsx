'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface CSVRow {
  [key: string]: string
}

interface ValidationError {
  row: number
  field: string
  message: string
}

interface ImportResult {
  success: boolean
  created: number
  updated: number
  errors: ValidationError[]
  details?: Array<{
    iccid: string
    action: 'created' | 'updated'
    status: 'success' | 'error'
    errorMessage?: string
  }>
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previewData, setPreviewData] = useState<CSVRow[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateCSVRow = (row: CSVRow, index: number): ValidationError[] => {
    const errors: ValidationError[] = []
    const rowNum = index + 2 // +2 because index 0 is row 2 (after header)

    // ICCID validation
    if (!row.iccid || !/^\d{19,20}$/.test(row.iccid)) {
      errors.push({
        row: rowNum,
        field: 'iccid',
        message: 'ICCID形式が不正です（19-20桁の数字）'
      })
    }

    // Supplier validation
    if (row.supplier && !['アーツ', 'ソフィア'].includes(row.supplier)) {
      errors.push({
        row: rowNum,
        field: 'supplier',
        message: '仕入れ先は「アーツ」または「ソフィア」を指定してください'
      })
    }

    // Date format validation
    const dateFields = ['supplierServiceStartDate', 'supplierServiceEndDate']
    dateFields.forEach(field => {
      if (row[field] && !/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(row[field])) {
        errors.push({
          row: rowNum,
          field,
          message: '日付形式が不正です（YYYY-MM-DD または YYYY/MM/DD）'
        })
      }
    })

    return errors
  }

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim())
    const rows: CSVRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row: CSVRow = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      rows.push(row)
    }

    return rows
  }

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('CSVファイルを選択してください')
      return
    }

    setFile(selectedFile)
    setResult(null)
    setError(null)

    // Parse and preview CSV
    const text = await selectedFile.text()
    const rows = parseCSV(text)
    setPreviewData(rows.slice(0, 10)) // Preview first 10 rows

    // Validate all rows
    const allErrors: ValidationError[] = []
    rows.forEach((row, index) => {
      const errors = validateCSVRow(row, index)
      allErrors.push(...errors)
    })
    setValidationErrors(allErrors)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('ファイルを選択してください')
      return
    }

    if (validationErrors.length > 0) {
      setError('バリデーションエラーがあります。修正してから再度アップロードしてください。')
      return
    }

    setUploading(true)
    setError(null)
    setResult(null)

    // Mock upload (simulate API call)
    setTimeout(() => {
      const mockResult: ImportResult = {
        success: true,
        created: Math.floor(previewData.length * 0.6),
        updated: Math.floor(previewData.length * 0.35),
        errors: [],
        details: previewData.map((row, index) => ({
          iccid: row.iccid,
          action: Math.random() > 0.5 ? 'created' : 'updated',
          status: 'success'
        }))
      }

      setResult(mockResult)
      setFile(null)
      setPreviewData([])
      setValidationErrors([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      setUploading(false)

      // Show success message
      alert(`取込が完了しました\n作成: ${mockResult.created}件\n更新: ${mockResult.updated}件`)
    }, 2000)
  }

  const validRowCount = previewData.length - validationErrors.length
  const errorRowCount = validationErrors.length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">CSV一括取込</h1>
        <p className="mt-2 text-sm text-gray-600">
          CSVファイルをアップロードしてSIM情報を一括登録・更新します
        </p>
      </div>

      {/* Template Download */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-sm font-medium text-blue-900 mb-2">📥 CSVテンプレート</h2>
        <p className="text-sm text-blue-700 mb-3">
          以下のテンプレートをダウンロードして、SIM情報を入力してください。
        </p>
        <button
          onClick={() => alert('テンプレートダウンロード機能（モック）')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          テンプレートをダウンロード
        </button>
      </div>

      {/* CSV Format Info */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">📋 CSVフォーマット</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">必須カラム:</p>
            <ul className="list-disc list-inside ml-2 space-y-1 text-sm text-gray-600">
              <li>iccid (19-20桁の数字)</li>
              <li>supplier (仕入れ先: アーツ / ソフィア)</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">任意カラム:</p>
            <ul className="list-disc list-inside ml-2 space-y-1 text-sm text-gray-600">
              <li>msisdn (電話番号)</li>
              <li>ownerCompany (所有会社)</li>
              <li>plan (プラン名)</li>
              <li>customerType (顧客タイプ)</li>
              <li>supplierServiceStartDate (開始日)</li>
              <li>supplierServiceEndDate (終了日)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">ファイルアップロード</h2>

        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-6xl mb-4">📁</div>
          <p className="text-lg font-medium text-gray-900 mb-2">
            CSVファイルをドラッグ&ドロップ
          </p>
          <p className="text-sm text-gray-500 mb-4">
            または クリックして選択
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {file && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">📄 {file.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  サイズ: {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                onClick={() => {
                  setFile(null)
                  setPreviewData([])
                  setValidationErrors([])
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                ✕ 削除
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* CSV Preview */}
      {previewData.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">プレビュー（最初の10行）</h2>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600 font-medium">✓ 有効: {validRowCount}行</span>
              <span className="text-red-600 font-medium">✗ エラー: {errorRowCount}行</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">状態</th>
                  {Object.keys(previewData[0] || {}).map(key => (
                    <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((row, index) => {
                  const rowErrors = validationErrors.filter(e => e.row === index + 2)
                  const hasError = rowErrors.length > 0

                  return (
                    <tr key={index} className={hasError ? 'bg-red-50' : ''}>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        {hasError ? (
                          <span className="text-red-600 text-lg" title={rowErrors.map(e => e.message).join(', ')}>
                            ✗
                          </span>
                        ) : (
                          <span className="text-green-600 text-lg">✓</span>
                        )}
                      </td>
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap">
                          {value || '-'}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-sm font-medium text-red-900 mb-2">❌ バリデーションエラー</h3>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {validationErrors.slice(0, 10).map((error, index) => (
                  <p key={index} className="text-xs text-red-800">
                    行{error.row}: {error.field} - {error.message}
                  </p>
                ))}
                {validationErrors.length > 10 && (
                  <p className="text-xs text-red-800 font-medium">
                    他 {validationErrors.length - 10} 件のエラー
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="mt-6">
            <button
              onClick={handleSubmit}
              disabled={uploading || validationErrors.length > 0}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  アップロード中...
                </>
              ) : (
                <>
                  📤 {previewData.length}件のデータをアップロード
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Import Result */}
      {result && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">✅</span>
            <h2 className="text-xl font-semibold">取込完了</h2>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">作成</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{result.created}</p>
              <p className="text-xs text-green-700 mt-1">新規登録</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">更新</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{result.updated}</p>
              <p className="text-xs text-blue-700 mt-1">既存データ更新</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 font-medium">合計</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{result.created + result.updated}</p>
              <p className="text-xs text-gray-700 mt-1">処理件数</p>
            </div>
          </div>

          {/* Details Table */}
          {result.details && result.details.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-3">詳細</h3>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ICCID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.details.slice(0, 20).map((detail, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900 font-mono">{detail.iccid}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            detail.action === 'created'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {detail.action === 'created' ? '作成' : '更新'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-green-600 font-medium">✓ 成功</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result.details.length > 20 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  他 {result.details.length - 20} 件の結果
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href="/sims"
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 font-medium transition-colors"
            >
              SIM一覧を表示
            </Link>
            <button
              onClick={() => {
                setResult(null)
                setFile(null)
                setPreviewData([])
                setValidationErrors([])
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium transition-colors"
            >
              続けて取込
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
