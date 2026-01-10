import { SimStatus } from '@prisma/client'

interface StatusBadgeProps {
  status: SimStatus
  size?: 'sm' | 'md' | 'lg'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  }

  const statusConfig = {
    IN_STOCK: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: '在庫'
    },
    ACTIVE: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      label: '利用中'
    },
    RETURNING: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      label: '返却中'
    },
    RETIRED: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      label: '廃止'
    }
  }

  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  )
}
