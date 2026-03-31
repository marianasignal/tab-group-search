import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { SearchPanel } from "./SearchPanel";

const App = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 监听快捷键命令
    chrome.commands.onCommand.addListener((command) => {
      if (command === "toggle-search") {
        setIsOpen((prev) => !prev);
      }
    });

    // 监听 Esc 键关闭面板
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return <SearchPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />;
};

// 创建容器并挂载
const container = document.createElement("div");
container.id = "attention-queue-search-panel";
document.body.appendChild(container);

const root = createRoot(container);
root.render(<App />);
