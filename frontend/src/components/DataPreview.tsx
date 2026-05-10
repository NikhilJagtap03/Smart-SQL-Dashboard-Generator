import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataPreview({ tableName }: { tableName: string }) {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 100;   // Rows per page

  const fetchPreview = async (page: number) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/preview/${tableName}`, {
        params: { page, limit }
      });
      
      setData(res.data.data);
      setColumns(res.data.columns);
      setTotalRows(res.data.total_rows);
      setTotalPages(res.data.total_pages);
      setCurrentPage(page);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview(1);
  }, [tableName]);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    fetchPreview(page);
  };

  if (loading) {
    return <div className="p-12 text-center">Loading data...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          Data Preview 
          <span className="text-sm font-normal text-gray-500 ml-3">
            {totalRows.toLocaleString()} total rows • Page {currentPage} of {totalPages}
          </span>
        </h2>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[580px] border border-gray-700 rounded-xl">
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

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg"
        >
          <ChevronLeft size={18} /> Previous
        </button>

        <div className="text-gray-400">
          Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalRows)} of {totalRows.toLocaleString()} rows
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg"
        >
          Next <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}