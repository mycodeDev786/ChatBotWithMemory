"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Icon components for a cleaner UI. Using inline SVGs to avoid dependencies.
const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const PaperclipIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19" />
  </svg>
);

const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m22 2-7 20-4-9-9-4 20-7z" />
    <path d="M22 2 11 13" />
  </svg>
);

const MenuIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

export default function App({
  onSendMessage,
  chats,
  setChats,
  activeChatId,
  setActiveChatId,
  messages,
}) {
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() && !selectedFile) return;

    if (input.trim().toLowerCase() === "save chat") {
      // The saving is now handled by the parent component, so we just add a message
      // and let the state update propagate down.
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    role: "assistant",
                    content:
                      "Your chat has been saved. You can find it in the sidebar.",
                  },
                ],
              }
            : chat
        )
      );
      setInput("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const fileData = selectedFile ? reader.result : null;
      const newMessage = {
        role: "user",
        content: input,
        file: fileData,
        fileName: selectedFile ? selectedFile.name : null,
      };

      // Call the parent's handler to send the message
      onSendMessage(newMessage, messages);
      setInput("");
      setSelectedFile(null);
    };

    if (selectedFile) {
      reader.readAsDataURL(selectedFile);
    } else {
      reader.onload(); // Trigger the logic immediately if no file
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectChat = (id) => {
    setActiveChatId(id);
    setIsSidebarOpen(false);
  };

  const handleDeleteChat = (id) => {
    setChats((prev) => prev.filter((chat) => chat.id !== id));
    if (id === activeChatId) {
      setActiveChatId(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200 font-inter antialiased overflow-hidden">
      {/* Sidebar - Collapsible on Mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-gray-800 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-gray-700">
          <button
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-colors duration-200"
            onClick={handleNewChat}
          >
            <PlusIcon />
            <span>New Chat</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pt-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center justify-between p-3 mx-2 my-1 cursor-pointer rounded-lg transition-colors duration-200 ${
                chat.id === activeChatId ? "bg-gray-700" : "hover:bg-gray-700"
              }`}
              onClick={() => handleSelectChat(chat.id)}
            >
              <span className="flex-1 truncate text-sm">{chat.title}</span>
              <button
                className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-gray-600 focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteChat(chat.id);
                }}
                aria-label="Delete chat"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 relative">
        {/* Header with hamburger menu for mobile */}
        <div className="bg-gray-800 p-4 border-b border-gray-700 md:hidden flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-200"
          >
            <MenuIcon />
          </button>
          <span className="font-semibold text-lg">
            {activeChatId
              ? chats.find((c) => c.id === activeChatId)?.title
              : "New Chat"}
          </span>
          <div className="w-6"></div> {/* Spacer to center the title */}
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-gray-500">
              <span className="max-w-md">
                Start a new conversation or select an existing one to begin.
              </span>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xl px-5 py-3 rounded-2xl shadow-lg transition-all duration-300 ease-in-out
                    ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-200"
                    } ${idx === messages.length - 1 ? "animate-slide-in" : ""}`}
                >
                  <div className="prose prose-invert prose-sm">
                    {msg.role === "user" ? (
                      <p>{msg.content}</p>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                  {msg.file && (
                    <div className="mt-2 text-xs">
                      <a
                        href={msg.file}
                        download={msg.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-yellow-300 underline hover:text-yellow-400 transition-colors"
                      >
                        <span className="flex items-center space-x-1">
                          <PaperclipIcon />
                          <span>{msg.fileName}</span>
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box with file selection preview */}
        <div className="sticky bottom-0 border-t border-gray-700 p-4 bg-gray-900 flex flex-col space-y-2">
          {/* File preview */}
          {selectedFile && (
            <div className="flex items-center justify-between p-2 bg-gray-700 rounded-lg text-sm text-gray-400">
              <span className="truncate">📎 {selectedFile.name}</span>
              <button
                onClick={() => setSelectedFile(null)}
                className="ml-2 text-gray-400 hover:text-red-400"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
            {/* File attachment button */}
            <button
              onClick={() => fileInputRef.current.click()}
              className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors duration-200"
              aria-label="Attach file"
            >
              <PaperclipIcon />
            </button>

            {/* Message input */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              rows={1}
              placeholder="Send a message..."
              className="flex-1 resize-none bg-gray-800 rounded-xl px-4 py-3 leading-tight text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              style={{ maxHeight: "200px" }}
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded-xl transition-all duration-200"
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
