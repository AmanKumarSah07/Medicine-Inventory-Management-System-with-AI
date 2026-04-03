import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function AIDashboard({ state, pushLog, addMedicine }) {
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const askChatbot = async () => {
    if (!chatMessage.trim()) return;
    const msg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: msg }]);
    setIsTyping(true);

    try {
      // Calling our newly generated backend route
      const res = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'ai', content: data.answer || "Sorry, I couldn't process that." }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'ai', content: 'Connection to AI server failed.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file.name);
    setIsScanning(true);

    const formData = new FormData();
    formData.append('invoice', file);

    try {
      const res = await fetch('http://localhost:5000/api/ai/scan', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.extractedItems) {
        pushLog(`AI Invoice Scanner found ${data.extractedItems.length} items`);
        // Alert the user and optionally ask if they want to add them to inventory
        const accept = window.confirm(`AI found: \n${JSON.stringify(data.extractedItems, null, 2)}\n\nAdd to inventory?`);
        if (accept) {
          data.extractedItems.forEach(item => {
            addMedicine({
              name: item.name,
              quantity: item.quantity || 10,
              expiry: item.expiry || '2025-12-31',
              reorderLevel: 20
            });
          });
        }
      } else {
        alert("Could not extract structured data.");
      }
    } catch (e) {
      alert("AI Scanning failed. Make sure the Node backend is running and HuggingFace API is configured.");
    } finally {
      setIsScanning(false);
      setUploadedFile(null);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-4">
      <div className="bg-white rounded-2xl shadow-sm border p-5 flex flex-col h-[500px]">
        <h3 className="text-lg font-semibold mb-4 text-blue-600">🧠 Database Assistant</h3>
        <div className="flex-1 overflow-y-auto mb-4 bg-slate-50 p-4 rounded-xl space-y-4">
          {chatHistory.length === 0 && (
            <div className="text-slate-400 text-sm text-center mt-10">
              Ask me anything about your inventory, orders, or stock status.
            </div>
          )}
          {chatHistory.map((m, i) => (
             <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-800'}`}>
                  {m.content}
                </div>
             </div>
          ))}
          {isTyping && <div className="text-xs text-slate-500 animate-pulse">AI is answering...</div>}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Type your question..."
            onKeyDown={(e) => e.key === 'Enter' && askChatbot()}
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700" onClick={askChatbot}>Ask</button>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-2xl shadow-sm border p-5">
           <h3 className="text-lg font-semibold mb-2">📸 AI Invoice Scanning</h3>
           <p className="text-sm text-slate-600 mb-4">Upload an image of a supplier invoice or prescription. The vision AI will read the text and automatically draft your restock list.</p>
           
           <label className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition">
             <span className="text-3xl mb-2">📄</span>
             <span className="text-sm font-medium text-slate-700">{isScanning ? 'Analyzing via HuggingFace...' : (uploadedFile || 'Click or drag image here')}</span>
             <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isScanning} />
           </label>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-sm border p-5 text-white">
           <h3 className="text-lg font-semibold mb-2">🔮 Predictive Restocking</h3>
           <p className="text-sm text-indigo-100 mb-4">AI connects to the backend MongoDB to analyze your historical dispensing metrics and actively warns you *before* seasonal stockouts occur.</p>
           <button className="bg-white text-indigo-700 font-semibold px-4 py-2 rounded-xl text-sm" onClick={() => alert("Will ping /predict endpoint to get aggregated insights.")}>
             Run Predictive Analysis
           </button>
        </div>
      </div>
    </div>
  );
}
