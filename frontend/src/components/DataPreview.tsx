import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DataPreview({ tableName }: { tableName: string }) {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreview();
  }, [tableName]);

  const fetchPreview = async () => {
    setLoading(true);
    try {
      // For now, we'll fetch sample data. We'll improve this soon.
      const res = await axios.get(`http://localhost:8000/preview/${tableName}?limit=50`);
      setData(res.data.data);
      setColumns(res.data.columns);
    } catch (error) {
      console.error(error);
      // Fallback - show empty for now
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center">Loading preview...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Data Preview (First 50 rows)</h2>
      
      <div className="overflow-auto max-h-[650px] border border-gray-700 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 sticky top-0">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-3 text-left font-medium text-gray-300 border-b border-gray-700">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-800/50">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-3 whitespace-nowrap">
                    {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}