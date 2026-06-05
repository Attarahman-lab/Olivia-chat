import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../db';
import { sendMessageToOlivia } from '../services/aiService';
import { Sun, Moon, ImageIcon, Flag } from 'lucide-react';

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversation();
  }, [user]);

  const loadConversation = async () => {
    let conv = await db.conversations.where('userId').equals(user.id).first();
    if (!conv) {
      const id = await db.conversations.add({ userId: user.id, createdAt: Date.now(), lastMessageAt: Date.now() });
      conv = { id };
    }
    const msgs = await db.messages.where('conversationId').equals(conv.id).toArray();
    setMessages(msgs);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const conv = await db.conversations.where('userId').equals(user.id).first();
    await db.messages.add({ conversationId: conv.id, role: 'user', content: input, timestamp: Date.now() });

    const botReply = await sendMessageToOlivia(input);
    const botMsg = { role: 'assistant', content: botReply.answer, sources: botReply.sources, timestamp: Date.now() };
    setMessages(prev => [...prev, botMsg]);
    await db.messages.add({ conversationId: conv.id, role: 'assistant', content: botReply.answer, sources: botReply.sources, timestamp: Date.now() });
    
    setLoading(false);
  };

  const reportBadAnswer = async (msg) => {
    if (msg.reported) return;
    await db.messages.update(msg.id, { reported: true });
    alert('Thank you, we will improve Olivia!');
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
        <header className="bg-brand-purple text-white p-4 flex justify-between items-center">
          <h1 className="text-2xl font-futura">💜 Olivia AI</h1>
          <div className="flex gap-2">
            <button onClick={() => setDarkMode(!darkMode)}>{darkMode ? <Sun /> : <Moon />}</button>
            <button className="bg-brand-orange px-3 py-1 rounded">Report an issue</button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2/3 p-3 rounded-2xl ${msg.role === 'user' ? 'bg-brand-orange text-white' : 'bg-white dark:bg-gray-800 shadow'}`}>
                <p>{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="text-xs mt-1 text-gray-400">
                    📄 Sources: {msg.sources.map(s => `${s.filename} v${s.version || '?'} (p.${s.page})`).join(', ')}
                  </div>
                )}
                {msg.role === 'assistant' && (
                  <button onClick={() => reportBadAnswer(msg)} className="text-xs text-red-400 flex items-center gap-1 mt-1"><Flag size={12} /> Report bad answer</button>
                )}
              </div>
            </div>
          ))}
          {loading && <div className="animate-pulse text-gray-500">Olivia is thinking... 🧠</div>}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 flex gap-2">
          <input className="flex-1 p-2 border rounded-full" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} placeholder="Ask Olivia about your PDFs..." />
          <button onClick={sendMessage} className="bg-brand-purple text-white px-4 rounded-full">Send</button>
          <button className="p-2 rounded-full border"><ImageIcon size={20} /></button>
        </div>
      </div>
    </div>
  );
}