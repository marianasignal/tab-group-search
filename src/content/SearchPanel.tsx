import React, { useState, useEffect } from "react";
import Fuse from "fuse.js";
import { TabRecord } from "../types/storage";

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const S = {
  overlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    zIndex: 2147483646,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  panel: {
    backgroundColor: "#000000",
    borderRight: "1px solid #333333",
    width: "450px",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  searchBox: {
    padding: "16px",
    borderBottom: "1px solid #333333",
  },
  input: {
    width: "100%",
    padding: "10px 16px",
    backgroundColor: "#111111",
    color: "#ffffff",
    border: "1px solid #444444",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  groupBar: {
    padding: "10px 16px",
    borderBottom: "1px solid #333333",
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
  },
  groupBtnAll: (selected: boolean) => ({
    padding: "4px 12px",
    fontSize: "13px",
    borderRadius: "4px",
    border: "1px solid #555555",
    cursor: "pointer",
    backgroundColor: selected ? "#ffffff" : "transparent",
    color: selected ? "#000000" : "#aaaaaa",
  }),
  groupBtn: (selected: boolean) => ({
    padding: "4px 12px",
    fontSize: "13px",
    borderRadius: "4px",
    border: selected ? "2px solid #ffffff" : "1px solid #555555",
    cursor: "pointer",
    backgroundColor: selected ? "#333333" : "#1a1a1a",
    color: "#ffffff",
  }),
  list: {
    flex: 1,
    overflowY: "auto" as const,
  },
  empty: {
    color: "#666666",
    textAlign: "center" as const,
    padding: "32px 16px",
    fontSize: "14px",
  },
  item: (selected: boolean) => ({
    padding: "14px 16px",
    cursor: "pointer",
    borderBottom: "1px solid #1a1a1a",
    borderLeft: selected ? "3px solid #ffffff" : "3px solid transparent",
    backgroundColor: selected ? "#1a1a1a" : "transparent",
  }),
  itemTitle: (selected: boolean) => ({
    fontSize: "14px",
    fontWeight: 500,
    color: selected ? "#ffffff" : "#cccccc",
    marginBottom: "6px",
    lineHeight: "1.4",
  }),
  tag: {
    display: "inline-block",
    padding: "2px 8px",
    fontSize: "11px",
    borderRadius: "3px",
    backgroundColor: "#333333",
    color: "#aaaaaa",
  },
};

export const SearchPanel: React.FC<SearchPanelProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [records, setRecords] = useState<TabRecord[]>([]);
  const [searchResults, setSearchResults] = useState<TabRecord[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<Array<{ name: string; color: string }>>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      chrome.storage.local.get(["tab_records"], (result) => {
        const allRecords = result.tab_records || [];
        setRecords(allRecords);
        const uniqueGroups = Array.from(
          new Map(allRecords.map((r) => [r.groupName, { name: r.groupName, color: r.groupColor }])).values()
        );
        setGroups(uniqueGroups);
        setSearchResults(allRecords);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    let filtered = records;
    if (selectedGroup) filtered = filtered.filter((r) => r.groupName === selectedGroup);
    if (!searchQuery.trim()) {
      setSearchResults(filtered);
      return;
    }
    const timer = setTimeout(() => {
      const fuse = new Fuse(filtered, { keys: ["title", "url", "groupName"], threshold: 0.3, ignoreLocation: true });
      setSearchResults(fuse.search(searchQuery).map((r) => r.item));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, records, selectedGroup]);

  useEffect(() => setSelectedIndex(0), [searchResults]);

  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && searchResults[selectedIndex]) {
      e.preventDefault();
      handleOpenUrl(searchResults[selectedIndex].url);
    }
  };

  const handleOpenUrl = (url: string) => {
    chrome.runtime.sendMessage({ type: "OPEN_URL", url });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.panel} onClick={(e) => e.stopPropagation()}>

        {/* 搜索框 */}
        <div style={S.searchBox}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索网页标题或分组..."
            style={S.input}
            autoFocus
          />
        </div>

        {/* 分组过滤 */}
        {groups.length > 0 && (
          <div style={S.groupBar}>
            <button style={S.groupBtnAll(selectedGroup === null)} onClick={() => setSelectedGroup(null)}>
              全部
            </button>
            {groups.map((group) => (
              <button
                key={group.name}
                style={S.groupBtn(selectedGroup === group.name)}
                onClick={() => setSelectedGroup(group.name)}
              >
                {group.name}
              </button>
            ))}
          </div>
        )}

        {/* 结果列表 */}
        <div style={S.list}>
          {searchResults.length === 0 ? (
            <div style={S.empty}>没有找到匹配的网页</div>
          ) : (
            searchResults.map((record, index) => (
              <div
                key={record.url}
                style={S.item(index === selectedIndex)}
                onClick={() => handleOpenUrl(record.url)}
              >
                <div style={S.itemTitle(index === selectedIndex)}>{record.title}</div>
                <span style={S.tag}>{record.groupName}</span>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
