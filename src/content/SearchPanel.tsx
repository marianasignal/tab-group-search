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

  // 加载数据
  useEffect(() => {
    if (isOpen) {
      chrome.storage.local.get(["tab_records"], (result) => {
        const allRecords = result.tab_records || [];
        setRecords(allRecords);
        setSearchResults(allRecords);
      });
    }
  }, [isOpen]);

  // 实现搜索
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(records);
      return;
    }

    const timer = setTimeout(() => {
      const fuse = new Fuse(records, {
        keys: ["title", "url", "groupName"],
        threshold: 0.3,
        ignoreLocation: true,
      });

      const results = fuse.search(searchQuery);
      setSearchResults(results.map((r) => r.item));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, records]);

  const handleOpenUrl = (url: string) => {
    chrome.tabs.create({ url });
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
            placeholder="搜索网页标题、URL 或分组..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {/* 结果列表 */}
        <div className="flex-1 overflow-y-auto">
          {searchResults.length === 0 ? (
            <div className="text-gray-400 text-center py-8">没有找到匹配的网页</div>
          ) : (
            <div className="divide-y">
              {searchResults.map((record) => (
                <div
                  key={record.url}
                  className="p-3 hover:bg-gray-50 cursor-pointer"
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
