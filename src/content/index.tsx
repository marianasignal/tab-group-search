import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { SearchPanel } from "./SearchPanel";

const App = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 监听来自 background 的消息
    const messageListener = (
      message: { type: string },
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      if (message.type === 'TOGGLE_SEARCH_PANEL') {
        setIsOpen((prev) => !prev);
        sendResponse({ success: true });
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // 监听 Esc 键关闭面板
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return <SearchPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />;
};

// 创建容器并挂载
const container = document.createElement("div");
container.id = "attention-queue-search-panel";
document.body.appendChild(container);

const root = createRoot(container);
root.render(<App />);
