"use client";

import { useState } from "react";
import ChatUI from "./components/ChatUI";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const handleSendMessage = async (newMessage, setMessages) => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("message", newMessage.content);
      if (newMessage.file) {
        formData.append("file", newMessage.file);
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Error: Could not get a reply." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen">
      <ChatUI onSendMessage={handleSendMessage} />
      {loading && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-gray-400 text-sm">
          AI is thinking...
        </div>
      )}
    </div>
  );
}
