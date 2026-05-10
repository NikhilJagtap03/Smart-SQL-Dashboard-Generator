import { useState } from 'react';
import axios from 'axios';
import { Send } from 'lucide-react';

export default function TextToSQL({ tableName }: { tableName: string }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/text-to-sql', {
        table_name: tableName,
        question: question
      });
      
      setResult(res.data);
    } catch (error) {
      alert("Failed to generate SQL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-6">Ask Questions in Natural Language</h2>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Example: Show me top 10 products by sales"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-5 py-4 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-8 rounded-xl flex items-center gap-2 disabled:opacity-50"
          >
            <Send size={20} />
            Ask
          </button>
        </div>
      </form>

      {result && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
          <h3 className="font-medium mb-3 text-blue-400">Generated SQL:</h3>
          <pre className="bg-black p-4 rounded-lg text-sm overflow-auto mb-6">
            {result.sql_query}
          </pre>

          {result.success ? (
            <>
              <h3 className="font-medium mb-3">Results ({result.row_count} rows)</h3>
              <div className="overflow-auto max-h-96 border border-gray-700 rounded-lg">
                {/* Simple result table */}
                <table className="w-full text-sm">
                  <thead className="bg-gray-800">
                    <tr>
                      {result.columns.map((col: string) => (
                        <th key={col} className="px-4 py-2 text-left">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.slice(0, 50).map((row: any, i: number) => (
                      <tr key={i} className="border-t border-gray-700">
                        {result.columns.map((col: string) => (
                          <td key={col} className="px-4 py-2">{String(row[col] ?? '-')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-red-400">Error: {result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}