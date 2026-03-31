import React, { useState, useEffect } from "react";
import Fuse from "fuse.js";
import { TabRecord } from "../types/storage";

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// 计算颜色亮度并返回合适的文字颜色
const getTextColor = (bgColor: string): string => {
  // 如果是 Chrome 标签组颜色名称，使用白色
  const chromeColors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
  if (chromeColors.includes(bgColor)) return '#ffffff';

  // 如果是十六进制颜色，计算亮度
  if (bgColor.startsWith('#')) {
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }

  return '#ffffff';
};

export const SearchPanel: React.FC<SearchPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [records, setRecords] = useState<TabRecord[]>([]);
  const [searchResults, setSearchResults] = useState<TabRecord[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<Array<{ name: string; color: string }>>(
    [],
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 加载数据
  useEffect(() => {
    if (isOpen) {
      chrome.storage.local.get(["tab_records"], (result) => {
        const allRecords = result.tab_records || [];
        setRecords(allRecords);

        // 提取唯一分组
        const uniqueGroups = Array.from(
          new Map(
            allRecords.map((r) => [
              r.groupName,
              { name: r.groupName, color: r.groupColor },
            ]),
          ).values(),
        );
        setGroups(uniqueGroups);

        setSearchResults(allRecords);
      });
    }
  }, [isOpen]);

  // 实现搜索
  useEffect(() => {
    let filtered = records;

    // 先按分组过滤
    if (selectedGroup) {
      filtered = filtered.filter((r) => r.groupName === selectedGroup);
    }

    // 再按关键词搜索
    if (!searchQuery.trim()) {
      setSearchResults(filtered);
      return;
    }

    const timer = setTimeout(() => {
      const fuse = new Fuse(filtered, {
        keys: ["title", "url", "groupName"],
        threshold: 0.3,
        ignoreLocation: true,
      });

      const results = fuse.search(searchQuery);
      setSearchResults(results.map((r) => r.item));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, records, selectedGroup]);

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log('[SearchPanel] Key pressed:', e.key, 'selectedIndex:', selectedIndex, 'results:', searchResults.length);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const newIndex = prev < searchResults.length - 1 ? prev + 1 : prev;
        console.log('[SearchPanel] ArrowDown: moving from', prev, 'to', newIndex);
        return newIndex;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const newIndex = prev > 0 ? prev - 1 : prev;
        console.log('[SearchPanel] ArrowUp: moving from', prev, 'to', newIndex);
        return newIndex;
      });
    } else if (e.key === "Enter" && searchResults[selectedIndex]) {
      e.preventDefault();
      console.log('[SearchPanel] Enter pressed, opening:', searchResults[selectedIndex].url);
      handleOpenUrl(searchResults[selectedIndex].url);
    }
  };

  const handleOpenUrl = (url: string) => {
    console.log('[SearchPanel] Opening URL:', url);
    // Content script 无法直接调用 chrome.tabs.create，需要通过 background
    chrome.runtime.sendMessage({ type: 'OPEN_URL', url }, (response) => {
      console.log('[SearchPanel] URL opened:', response);
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-start justify-start z-[999999]"
      onClick={onClose}
    >
      <div
        className="bg-black border-r border-gray-700 shadow-2xl w-[450px] h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 搜索框 */}
        <div className="p-4 border-b border-gray-700">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索网页标题、URL 或分组..."
            className="w-full px-4 py-2 bg-gray-900 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            autoFocus
          />
        </div>

        {/* 分组过滤标签 */}
        {groups.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-700 flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedGroup(null)}
              className={`px-3 py-1 text-sm rounded transition-all ${
                selectedGroup === null
                  ? "bg-white text-black"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600"
              }`}
            >
              全部
            </button>
            {groups.map((group) => (
              <button
                key={group.name}
                onClick={() => setSelectedGroup(group.name)}
                className={`px-3 py-1 text-sm rounded transition-all ${
                  selectedGroup === group.name
                    ? "ring-2 ring-white scale-105"
                    : "hover:scale-105 opacity-80 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: group.color || "#6b7280",
                  color: "#ffffff",
                }}
              >
                {group.name}
              </button>
            ))}
          </div>
        )}

        {/* 结果列表 */}
        <div className="flex-1 overflow-y-auto">
          {searchResults.length === 0 ? (
            <div className="text-gray-500 text-center py-8">没有找到匹配的网页</div>
          ) : (
            <div>
              {searchResults.map((record, index) => (
                <div
                  key={record.url}
                  className={`p-4 cursor-pointer transition-all border-b border-gray-800 ${
                    index === selectedIndex
                      ? "bg-gray-900 border-l-4 border-white"
                      : "hover:bg-gray-900/50"
                  }`}
                  onClick={() => handleOpenUrl(record.url)}
                >
                  <div className={`font-medium mb-2 ${
                    index === selectedIndex ? "text-white" : "text-gray-300"
                  }`}>
                    {record.title}
                  </div>
                  <div>
                    <span
                      className="inline-block px-2 py-1 text-xs rounded"
                      style={{
                        backgroundColor: record.groupColor || "#6b7280",
                        color: "#ffffff",
                      }}
                    >
                      {record.groupName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
