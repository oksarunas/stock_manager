import React, { useState } from 'react';
import { ChatMessage } from '../types/interfaces';

interface ChatProps {
  title?: string;
  onSend: (message: string) => Promise<ChatMessage | null>;
}

const Chat: React.FC<ChatProps> = ({ title = "Chat", onSend }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add the user's message
    const userMessage: ChatMessage = { sender: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    // Send the message to onSend function
    const botResponse = await onSend(input);
    if (botResponse) {
      setMessages((prev) => [...prev, botResponse]);
    }

    setInput('');
  };
  
  return (
    <div className="chat-container">
      <h2 className="text-xl font-semibold mb-2 text-center text-accent">{title}</h2>
      <div className="messages p-4 h-64 overflow-y-auto bg-secondary rounded-lg shadow-inner">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <span
              className={`inline-block px-3 py-2 rounded ${
                msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white'
              }`}
            >
              {msg.content}
            </span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="input-field"
        />
        <button type="submit" className="button-primary">
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
