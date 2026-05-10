import { useState, useEffect } from 'react';
import axios from 'axios';

interface InsightsResponse {
  insights: string;
  success: boolean;
}

export default function AIInsights({ tableName }: { tableName: string }) {
  const [insights, setInsights] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/insights/${tableName}`);
      const data = res.data;
      
      setInsights(data.insights || "No insights generated.");
      
      // Extract suggested questions from the text
      const questions = extractSuggestedQuestions(data.insights);
      setSuggestedQuestions(questions);
      
    } catch (error) {
      setInsights("Failed to generate insights. Make sure Ollama is running.");
      setSuggestedQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Extract questions from AI response
  const extractSuggestedQuestions = (text: string): string[] => {
    const questions: string[] = [];
    const lines = text.split('\n');
    
    let inQuestionsSection = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.toLowerCase().includes("suggested next questions") || 
          trimmed.toLowerCase().includes("next questions")) {
        inQuestionsSection = true;
        continue;
      }
      
      if (inQuestionsSection && trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d+\./)) {
        const question = trimmed.replace(/^[-•\d.]+\s*/, '').trim();
        if (question.length > 10) {
          questions.push(question);
        }
      }
      
      // Stop if we reach another section
      if (inQuestionsSection && trimmed.includes(':') && !trimmed.startsWith('-') && trimmed.length < 30) {
        if (!trimmed.toLowerCase().includes("question")) inQuestionsSection = false;
      }
    }
    
    return questions.slice(0, 6); // Max 6 questions
  };

  const handleQuestionClick = (question: string) => {
    alert(`Question clicked: "${question}"\n\nText-to-SQL feature coming next!`);
    // In the next step, this will trigger SQL generation + chart
    console.log("Selected Question:", question);
  };

  useEffect(() => {
    fetchInsights();
  }, [tableName]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold flex items-center gap-3">
          💡 AI Business Insights
        </h2>
        <button 
          onClick={fetchInsights}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition"
        >
          Regenerate Insights
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-400">AI is analyzing your data...</p>
        </div>
      ) : (
        <>
          {/* Insights Content */}
          <div className="prose prose-invert max-w-none bg-gray-950 border border-gray-700 rounded-2xl p-8 leading-relaxed whitespace-pre-wrap mb-10">
            {insights}
          </div>

          {/* Suggested Questions */}
          {suggestedQuestions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-400">💡 Suggested Next Questions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionClick(question)}
                    className="text-left p-4 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-xl transition-all group"
                  >
                    <div className="text-sm text-gray-300 group-hover:text-white">
                      {question}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}