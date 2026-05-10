import { useState } from 'react';
import DataPreview from './DataPreview';
import AIInsights from './AIInsights';
import TextToSQL from './TextToSQL';
import AutoCharts from './AutoCharts';

export default function Dashboard({ currentTable }: { currentTable: string | null }) {
  const [activeView, setActiveView] = useState<'preview' | 'insights' | 'ask' | 'charts'>('preview');

  if (!currentTable) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <h2 className="text-2xl mb-2">No Data Selected</h2>
          <p>Upload a CSV file first from the sidebar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Smart Dashboard</h1>
          <p className="text-gray-400">
            Table: <span className="font-mono text-blue-400">{currentTable}</span>
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 bg-gray-900 p-1 rounded-xl">
          <button
            onClick={() => setActiveView('preview')}
            className={`px-5 py-2 rounded-xl transition ${activeView === 'preview' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
          >
            📋 Preview
          </button>

          <button
            onClick={() => setActiveView('insights')}
            className={`px-5 py-2 rounded-xl transition ${activeView === 'insights' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
          >
            💡 AI Insights
          </button>

          <button
            onClick={() => setActiveView('ask')}
            className={`px-5 py-2 rounded-xl transition ${activeView === 'ask' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
          >
            🤖 Ask AI
          </button>

          <button
            onClick={() => setActiveView('charts')}
            className={`px-5 py-2 rounded-xl transition ${activeView === 'charts' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
          >
            📊 Auto Charts
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl min-h-[650px]">
        {activeView === 'preview' && <DataPreview tableName={currentTable} />}
        {activeView === 'insights' && <AIInsights tableName={currentTable} />}
        {activeView === 'ask' && <TextToSQL tableName={currentTable} />}
        {activeView === 'charts' && <AutoCharts tableName={currentTable} />}
      </div>
    </div>
  );
}