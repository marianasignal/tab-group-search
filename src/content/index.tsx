import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { SearchPanel } from "./SearchPanel";

const App = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [, forceRender] = useState({});
  const isOpenRef = React.useRef(isOpen);

  // 同步 ref 和 state
  useEffect(() => {
    isOpenRef.current = isOpen;
    console.log('[Content Script] isOpen state changed to:', isOpen);
  }, [isOpen]);

  useEffect(() => {
    // 监听来自 background 的消息
    const messageListener = (
      message: { type: string },
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      console.log('[Content Script] Message received:', message.type, 'current state:', isOpenRef.current);
      if (message.type === 'TOGGLE_SEARCH_PANEL') {
        const newValue = !isOpenRef.current;
        console.log('[Content Script] Toggling to:', newValue);
        // 强制更新：先设置状态，再强制重新渲染
        setIsOpen(newValue);
        // 使用微任务确保状态更新被应用
        Promise.resolve().then(() => {
          forceRender({});
          console.log('[Content Script] Force re-render triggered');
        });
        sendResponse({ success: true, newState: newValue });
      }
      return true;
    };

    chrome.runtime.onMessage.addListener(messageListener);
    console.log('[Content Script] Message listener registered');

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  // 监听 Esc 关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown, true);
      return () => {
        document.removeEventListener("keydown", handleKeyDown, true);
      };
    }
  }, [isOpen]);

  return <SearchPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />;
};

// 创建容器并挂载
const container = document.createElement("div");
container.id = "attention-queue-search-panel";

// 确保 body 存在
if (document.body) {
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(<App />);
  console.log('[Content Script] Initialized and mounted on', window.location.href);
} else {
  // 如果 body 还不存在，等待 DOM 就绪
  console.log('[Content Script] Body not ready, waiting...');
  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(<App />);
    console.log('[Content Script] Initialized after DOM ready on', window.location.href);
  });
}
