import React from 'react'

interface ModelIndicatorProps {
  currentModel: string
}

const ModelIndicator: React.FC<ModelIndicatorProps> = ({ currentModel }) => {
  const getModelColor = (model: string) => {
    if (model.includes('3.5 Sonnet')) return 'bg-blue-500'
    if (model.includes('3.7 Sonnet')) return 'bg-cyan-500'
    if (model.includes('Sonnet 4')) return 'bg-emerald-500'
    if (model.includes('Opus 4')) return 'bg-rose-500'
    if (model.includes('3.5 Haiku')) return 'bg-green-500'
    if (model.includes('Opus 3') || model.includes('3 Opus')) return 'bg-purple-500'
    if (model.includes('3 Sonnet')) return 'bg-indigo-500'
    return 'bg-gray-500'
  }

  const getModelShortName = (model: string) => {
    if (model.includes('3.5 Sonnet')) return '3.5S'
    if (model.includes('3.7 Sonnet')) return '3.7S'
    if (model.includes('Sonnet 4')) return 'S4'
    if (model.includes('Opus 4')) return 'O4'
    if (model.includes('3.5 Haiku')) return '3.5H'
    if (model.includes('Opus 3') || model.includes('3 Opus')) return 'O3'
    if (model.includes('3 Sonnet')) return '3S'
    return 'AI'
  }

  return (
    <div className="fixed top-2 left-4 z-50">
      <div className={`${getModelColor(currentModel)} text-white px-2 py-1 rounded-md text-xs font-medium shadow-lg flex items-center space-x-1`}>
        <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
        <span>{getModelShortName(currentModel)}</span>
      </div>
      <div className="absolute top-full left-0 mt-1 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
        {currentModel}
      </div>
    </div>
  )
}

export default ModelIndicator 