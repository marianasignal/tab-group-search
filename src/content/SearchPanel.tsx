import React, { useState, useEffect } from "react";
import Fuse from "fuse.js";
import { TabRecord } from "../types/storage";

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999999]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-[600px] max-h-[500px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 搜索框 */}
        <div className="p-4 border-b">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索网页标题、URL 或分组..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {/* 分组过滤标签 */}
        {groups.length > 0 && (
          <div className="px-4 py-2 border-b flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedGroup(null)}
              className={`px-3 py-1 text-sm rounded ${
                selectedGroup === null
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              全部
            </button>
            {groups.map((group) => (
              <button
                key={group.name}
                onClick={() => setSelectedGroup(group.name)}
                className={`px-3 py-1 text-sm rounded ${
                  selectedGroup === group.name ? "ring-2 ring-blue-500" : ""
                }`}
                style={{
                  backgroundColor: group.color || "#gray",
                  color: "#fff",
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
            <div className="text-gray-400 text-center py-8">没有找到匹配的网页</div>
          ) : (
            <div className="divide-y">
              {searchResults.map((record, index) => (
                <div
                  key={record.url}
                  className={`p-3 cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? "bg-blue-100 border-l-4 border-blue-600"
                      : "hover:bg-gray-50"
                  }`}
                  style={
                    index === selectedIndex
                      ? {
                          backgroundColor: "#dbeafe !important",
                          borderLeftWidth: "4px",
                          borderLeftColor: "#2563eb",
                        }
                      : undefined
                  }
                  onClick={() => handleOpenUrl(record.url)}
                >
                  <div className="font-medium text-gray-900">{record.title}</div>
                  <div className="text-sm text-gray-500 mt-1">{record.url}</div>
                  <div className="mt-1">
                    <span
                      className="inline-block px-2 py-1 text-xs rounded"
                      style={{ backgroundColor: record.groupColor || "#gray" }}
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
