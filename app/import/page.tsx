'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ImportResult {
  success: number
  errors: Array<{
    row: number
    iccid: string
    error: string
  }>
  summary: {
    total: number
    created: number
    updated: number
    failed: number
  }
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('ファイルを選択してください')
      return
    }

    setUploading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/sims/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'アップロードに失敗しました')
      }

      setResult(data)
      setFile(null)
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">CSV一括取込</h1>
        <p className="mt-2 text-sm text-gray-600">
          CSVファイルをアップロードしてSIM情報を一括登録・更新します
        </p>
      </div>

      {/* Template Download */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <h2 className="text-sm font-medium text-blue-900 mb-2">CSVテンプレート</h2>
        <p className="text-sm text-blue-700 mb-3">
          以下のテンプレートをダウンロードして、SIM情報を入力してください。
        </p>
        <a
          href="/templates/sim-import-template.csv"
          download
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          テンプレートをダウンロード
        </a>
      </div>

      {/* CSV Format Info */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">CSVフォーマット</h2>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>必須カラム:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>iccid (19-20桁の数字)</li>
            <li>supplier (仕入れ先: アーツ / ソフィア)</li>
          </ul>
          <p className="mt-3"><strong>任意カラム:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>msisdn (電話番号)</li>
            <li>ownerCompany (所有会社)</li>
            <li>plan (プラン名)</li>
            <li>customerType (顧客タイプ)</li>
            <li>supplierServiceStartDate (サービス開始日: YYYY-MM-DD)</li>
            <li>supplierServiceEndDate (サービス終了日: YYYY-MM-DD)</li>
          </ul>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-2">
              CSVファイルを選択
            </label>
            <input
              id="file-input"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {file && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">選択されたファイル: <strong>{file.name}</strong></p>
              <p className="text-sm text-gray-500">サイズ: {(file.size / 1024).toFixed(2)} KB</p>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3 text-red-800 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                アップロード中...
              </>
            ) : (
              'アップロード'
            )}
          </button>
        </form>
      </div>

      {/* Import Result */}
      {result && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">取込結果</h2>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-500">合計</p>
              <p className="text-2xl font-bold text-gray-900">{result.summary.total}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-md">
              <p className="text-sm text-green-600">作成</p>
              <p className="text-2xl font-bold text-green-900">{result.summary.created}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm text-blue-600">更新</p>
              <p className="text-2xl font-bold text-blue-900">{result.summary.updated}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-600">失敗</p>
              <p className="text-2xl font-bold text-red-900">{result.summary.failed}</p>
            </div>
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div>
              <h3 className="text-md font-medium text-red-800 mb-3">エラー詳細</h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {result.errors.map((err, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm font-medium text-red-900">
                      行 {err.row}: ICCID {err.iccid}
                    </p>
                    <p className="text-sm text-red-700">{err.error}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.success > 0 && (
            <div className="mt-4">
              <Link
                href="/sims"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                SIM一覧を表示
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
