import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981'];

interface ChartSuggestion {
  type: string;
  title: string;
  x: string;
  y: string;
  sql?: string;
}

export default function AutoCharts({ tableName }: { tableName: string }) {
  const [charts, setCharts] = useState<ChartSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [executedData, setExecutedData] = useState<Record<number, any[]>>({});

  const generateCharts = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/generate-charts', {
        table_name: tableName
      });
      setCharts(res.data.charts || []);
      setExecutedData({}); // Reset previous data
    } catch (error) {
      console.error(error);
      alert("Failed to generate charts");
    } finally {
      setLoading(false);
    }
  };

  const executeChartQuery = async (chart: ChartSuggestion, index: number) => {
    try {
      const res = await axios.post('http://localhost:8000/text-to-sql', {
        table_name: tableName,
        question: chart.title
      });
      
      if (res.data.success) {
        setExecutedData(prev => ({
          ...prev,
          [index]: res.data.data || []
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    generateCharts();
  }, [tableName]);

  const renderChart = (chart: ChartSuggestion, index: number) => {
    const data = executedData[index] || [];
    
    if (data.length === 0) {
      return (
        <button 
          onClick={() => executeChartQuery(chart, index)}
          className="w-full h-64 border border-dashed border-gray-600 rounded-xl flex items-center justify-center hover:border-blue-500 transition-colors"
        >
          Click to Load Chart Data
        </button>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        {chart.type === 'bar' && (
          <BarChart data={data}>
            <XAxis dataKey={chart.x} />
            <YAxis />
            <Tooltip />
            <Bar dataKey={chart.y} fill="#3b82f6" />
          </BarChart>
        )}

        {chart.type === 'line' && (
          <LineChart data={data}>
            <XAxis dataKey={chart.x} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey={chart.y} stroke="#3b82f6" strokeWidth={3} />
          </LineChart>
        )}

        {chart.type === 'pie' && (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey={chart.y}
              nameKey={chart.x}
            >
              {data.map((entry: any, i: number) => (
                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        )}
      </ResponsiveContainer>
    );
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold">📊 AI Suggested Charts</h2>
        <button
          onClick={generateCharts}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          Regenerate Charts
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">AI is thinking of best visualizations...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {charts.map((chart, index) => (
            <div key={index} className="bg-gray-950 border border-gray-700 rounded-2xl p-6">
              <h3 className="font-semibold text-lg mb-4">{chart.title}</h3>
              {renderChart(chart, index)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}