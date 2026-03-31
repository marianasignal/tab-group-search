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
      console.log('[Content Script] Message received:', message.type);
      if (message.type === 'TOGGLE_SEARCH_PANEL') {
        setIsOpen((prev) => {
          console.log('[Content Script] Toggle panel:', !prev);
          return !prev;
        });
        sendResponse({ success: true });
      }
      return true; // 保持消息通道开启
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []); // 移除 isOpen 依赖，避免重复注册

  // 单独处理 Esc 键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        console.log('[Content Script] Esc pressed, closing panel');
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen]);

  return <SearchPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />;
};

// 创建容器并挂载
const container = document.createElement("div");
container.id = "attention-queue-search-panel";
document.body.appendChild(container);

const root = createRoot(container);
root.render(<App />);

console.log('[Content Script] Initialized');
