export default function Dashboard({ currentTable }: { currentTable: string | null }) {
  if (!currentTable) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <h2 className="text-2xl mb-2">No Data Selected</h2>
          <p>Upload a CSV file first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard: {currentTable}</h1>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 text-center">
        <p className="text-gray-400 mb-4">AI Analysis & Charts will appear here</p>
        <p className="text-sm text-blue-400">Next step: Auto chart generation + Insights</p>
      </div>
    </div>
  );
}