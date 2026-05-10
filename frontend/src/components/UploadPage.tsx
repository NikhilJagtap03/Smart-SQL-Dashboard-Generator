import { useState, useEffect } from 'react';
import { Upload, FileText, Table } from 'lucide-react';
import axios from 'axios';

export default function UploadPage({ 
  onTableLoaded, 
  setActiveTab 
}: { 
  onTableLoaded: (table: string) => void;
  setActiveTab: (tab: 'upload' | 'dashboard') => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  // Load existing tables on mount
  const loadExistingTables = async () => {
    try {
      const res = await axios.get('http://localhost:8000/tables');
      // For now, we'll show uploaded files from previous uploads
      // You can enhance this later
    } catch (e) {
      console.log("No previous tables");
    }
  };

  useEffect(() => {
    loadExistingTables();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:8000/upload-csv', formData);
      const data = res.data;
      
      setUploadedFiles(prev => [...prev, data]);
      onTableLoaded(data.table_name);
      alert(`✅ ${file.name} uploaded successfully!`);
    } catch (error: any) {
      alert('Upload failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-2">Upload Your Data</h1>
      <p className="text-gray-400 mb-8">Drop your CSV file and let AI build the dashboard</p>

      <label className="border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors">
        <Upload className="w-16 h-16 text-blue-400 mb-4" />
        <p className="text-xl font-medium">Drop CSV file here</p>
        <p className="text-gray-500 mt-2">or click to browse</p>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />
      </label>

      {uploadedFiles.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText /> Uploaded Tables
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {uploadedFiles.map((file, i) => (
              <div 
                key={i}
                onClick={() => {
                  onTableLoaded(file.table_name);
                  setActiveTab('dashboard');
                }}
                className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:border-blue-500 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{file.filename}</p>
                    <p className="text-sm text-gray-400 font-mono">{file.table_name}</p>
                  </div>
                  <Table className="text-blue-400" />
                </div>
                <div className="mt-4 text-sm text-gray-400">
                  {file.row_count.toLocaleString()} rows
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}