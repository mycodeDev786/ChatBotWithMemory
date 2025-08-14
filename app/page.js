"use client";

import { useState, useEffect } from "react";
import ChatUI from "./components/ChatUI";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [savedChats, setSavedChats] = useState([]);

  useEffect(() => {
    async function fetchChats() {
      const res = await fetch("/api/list-chats");
      const data = await res.json();
      if (!data.error) {
        setSavedChats(data);
      }
    }
    fetchChats();
  }, []);

  async function loadChat(chatId) {
    const res = await fetch(`/api/load-chat?id=${chatId}`);
    const data = await res.json();
    if (data.error) {
      alert(data.error);
    } else {
      setChats((prev) => {
        const filtered = prev.filter((c) => c.id !== data.id);
        return [...filtered, data];
      });
      setActiveChatId(data.id);
    }
  }

  useEffect(() => {
    const savedChats = localStorage.getItem("chatHistory");
    if (savedChats) {
      setChats(JSON.parse(savedChats));
    }
  }, []);

  // Save chats to local storage whenever the chats state changes
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chats));
  }, [chats]);

  const handleSendMessage = async (newMessage, messages) => {
    setLoading(true);

    let updatedMessages = [...messages, newMessage];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();

      if (data.reply) {
        const assistantMessage = { role: "assistant", content: data.reply };
        updatedMessages = [...updatedMessages, assistantMessage];

        // Update the state for the active chat
        setChats((prevChats) => {
          // If it's a new chat, create a new one
          if (!activeChatId) {
            const newId = Date.now();
            const newChat = {
              id: newId,
              title: createChatTitle(
                newMessage.content ||
                  (newMessage.fileName ? newMessage.fileName : "New Chat")
              ),
              messages: updatedMessages,
            };
            setActiveChatId(newId);
            return [...prevChats, newChat];
          } else {
            // Otherwise, update the existing chat
            return prevChats.map((chat) =>
              chat.id === activeChatId
                ? { ...chat, messages: updatedMessages }
                : chat
            );
          }
        });
      }
    } catch (err) {
      console.error("Error sending message:", err);
      // Update the state with an error message
      setChats((prevChats) => {
        return prevChats.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: [
                  ...messages,
                  {
                    role: "assistant",
                    content: "⚠️ Error: Could not get a reply.",
                  },
                ],
              }
            : chat
        );
      });
    } finally {
      setLoading(false);
    }
  };

  const createChatTitle = (text) => {
    const words = text.split(" ").slice(0, 5).join(" ");
    return words.length > 0 ? words + "..." : "New Chat";
  };

  const activeMessages =
    chats.find((chat) => chat.id === activeChatId)?.messages || [];

  return (
    <div className="h-screen">
      {/* Sidebar */}

      <ChatUI
        onSendMessage={handleSendMessage}
        chats={chats}
        setChats={setChats}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
        messages={activeMessages}
        savedChats={savedChats}
      />
      {loading && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-gray-400 text-sm">
          AI is thinking...
        </div>
      )}
    </div>
  );
}
