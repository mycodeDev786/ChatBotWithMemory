"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatUI({ onSendMessage }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createChatTitle = (text) => {
    const words = text.split(" ").slice(0, 5).join(" ");
    return words.length > 0 ? words + "..." : "New Chat";
  };

  const handleSend = () => {
    if (!input.trim() && !selectedFile) return;

    const newMessage = {
      role: "user",
      content: input,
      file: selectedFile || null,
    };

    let updatedMessages = [...messages, newMessage];

    if (!activeChatId) {
      const newId = Date.now();
      const newChat = {
        id: newId,
        title: createChatTitle(
          input || (selectedFile ? selectedFile.name : "")
        ),
        messages: updatedMessages,
      };
      setChats((prev) => [...prev, newChat]);
      setActiveChatId(newId);
    } else {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, messages: updatedMessages }
            : chat
        )
      );
    }

    setMessages(updatedMessages);
    onSendMessage(newMessage, setMessages);
    setInput("");
    setSelectedFile(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectChat = (id) => {
    const selectedChat = chats.find((chat) => chat.id === id);
    setActiveChatId(id);
    setMessages(selectedChat ? selectedChat.messages : []);
  };

  const handleDeleteChat = (id) => {
    setChats((prev) => prev.filter((chat) => chat.id !== id));
    if (id === activeChatId) {
      setMessages([]);
      setActiveChatId(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
            onClick={() => {
              setActiveChatId(null);
              setMessages([]);
            }}
          >
            + New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`flex justify-between items-center p-3 cursor-pointer hover:bg-gray-700 ${
                chat.id === activeChatId ? "bg-gray-700" : ""
              }`}
              onClick={() => handleSelectChat(chat.id)}
            >
              <span className="truncate text-sm">{chat.title}</span>
              <button
                className="text-red-400 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteChat(chat.id);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xl px-4 py-2 rounded-lg prose prose-invert prose-sm
                  ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-200"
                  }`}
              >
                {/* Render markdown for AI responses, plain text for user */}
                {msg.role === "user" ? (
                  msg.content
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                )}

                {msg.file && (
                  <div className="mt-2">
                    <a
                      href={URL.createObjectURL(msg.file)}
                      download={msg.file.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-yellow-300 underline"
                    >
                      📎 {msg.file.name}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <div className="border-t border-gray-700 p-4 flex items-center gap-2">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg"
          >
            📎
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={1}
            placeholder="Send a message..."
            className="flex-1 resize-none bg-gray-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleSend}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            Send
          </button>
        </div>

        {selectedFile && (
          <div className="p-2 text-sm bg-gray-800 text-gray-300">
            Selected: {selectedFile.name}
          </div>
        )}
      </div>
    </div>
  );
}
