"use client";

import { useState } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface LogEntry {
  id: number;
  timestamp: string;
  toonRequest?: string;
  toonResponse?: string;
  aiDecision?: any;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Ciao! Sono il tuo assistente e-commerce. Puoi chiedermi di vedere i prodotti o di aggiungere qualcosa al carrello. Prova a dirmi: "Aggiungi 2 paia di scarpe Nike al carrello".' }
  ]);
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'Si è verificato un errore.' }]);
      } else {
        // Success
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Ho eseguito l'azione: ${data.aiDecision.action}. Guarda i log di sistema per vedere il payload TOON!` 
        }]);

        setLogs(prev => [{
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          toonRequest: data.toonRequest,
          toonResponse: data.toonResponse,
          aiDecision: data.aiDecision
        }, ...prev]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Errore di connessione al server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Chat Section */}
      <div className="flex flex-col w-1/2 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200 bg-blue-600 text-white">
          <h1 className="text-xl font-bold">LiteToon E-commerce Demo</h1>
          <p className="text-sm opacity-80">Simulatore Chatbot</p>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 text-blue-900 rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 p-3 rounded-lg rounded-bl-none animate-pulse">
                Sto pensando...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi un messaggio..." 
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Invia
          </button>
        </form>
      </div>

      {/* System Log Section */}
      <div className="flex flex-col w-1/2 bg-gray-900 text-green-400 font-mono text-sm">
        <div className="p-4 border-b border-gray-700 bg-gray-800 text-white flex justify-between items-center">
          <h2 className="text-lg font-semibold">System Log (TOON Payload)</h2>
          <span className="text-xs bg-gray-700 px-2 py-1 rounded">Highly Compressed</span>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-6">
          {logs.length === 0 ? (
            <div className="text-gray-500 italic text-center mt-10">
              Nessun log disponibile. Invia un messaggio per vedere la magia di TOON.
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="border border-gray-700 rounded bg-black p-3 shadow-lg">
                <div className="text-gray-400 text-xs mb-2 border-b border-gray-800 pb-1">
                  [{log.timestamp}] AI Decision: {log.aiDecision?.action}
                </div>
                
                <div className="mb-3">
                  <div className="text-blue-400 mb-1">↑ Request (AI to Adapter):</div>
                  <pre className="bg-gray-900 p-2 rounded overflow-x-auto text-yellow-300">
                    {log.toonRequest}
                  </pre>
                </div>
                
                <div>
                  <div className="text-green-400 mb-1">↓ Response (Adapter to AI):</div>
                  <pre className="bg-gray-900 p-2 rounded overflow-x-auto text-purple-300">
                    {log.toonResponse}
                  </pre>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
