interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  centered?: boolean
}

export default function LoadingSpinner({ size = 'md', text, centered = true }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3'
  }

  const spinner = (
    <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-blue-600 border-gray-200`} />
  )

  if (centered) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        {spinner}
        {text && <p className="mt-4 text-sm text-gray-600">{text}</p>}
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-2">
      {spinner}
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  )
}
