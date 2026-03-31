import React, { useState } from "react";

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

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

        {/* 结果列表占位 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-gray-400 text-center py-8">
            输入关键词开始搜索
          </div>
        </div>
      </div>
    </div>
  );
};
