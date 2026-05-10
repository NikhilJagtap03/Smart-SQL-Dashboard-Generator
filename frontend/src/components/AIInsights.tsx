import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AIInsights({ tableName }: { tableName: string }) {
  const [insights, setInsights] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, [tableName]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/insights/${tableName}`);
      setInsights(res.data.insights);
    } catch (error) {
      setInsights("Failed to generate insights. Make sure Ollama is running with llama3.1 model.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold flex items-center gap-3">
          💡 AI Business Insights
        </h2>
        <button 
          onClick={fetchInsights}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
        >
          Regenerate
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-400">AI is analyzing your data...</p>
        </div>
      ) : (
        <div className="prose prose-invert max-w-none bg-gray-950 border border-gray-700 rounded-2xl p-8 leading-relaxed whitespace-pre-wrap">
          {insights}
        </div>
      )}
    </div>
  );
}