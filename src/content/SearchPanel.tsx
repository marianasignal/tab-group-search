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
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: "10px 16px",
    backgroundColor: "#111111",
    color: "#ffffff",
    border: "1px solid #444444",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  syncBtn: {
    padding: "10px 14px",
    fontSize: "13px",
    borderRadius: "8px",
    border: "1px solid #444444",
    cursor: "pointer",
    backgroundColor: "#1a1a1a",
    color: "#ffffff",
    whiteSpace: "nowrap" as const,
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
    padding: "10px 16px",
    cursor: "pointer",
    borderBottom: "1px solid #1a1a1a",
    borderLeft: selected ? "3px solid #ffffff" : "3px solid transparent",
    backgroundColor: selected ? "#1a1a1a" : "transparent",
  }),
  itemTitle: (selected: boolean) => ({
    fontSize: "13px",
    fontWeight: 500,
    color: selected ? "#ffffff" : "#cccccc",
    lineHeight: "1.4",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    flex: 1,
  }),
  tag: {
    display: "inline-block",
    padding: "2px 6px",
    fontSize: "11px",
    borderRadius: "3px",
    backgroundColor: "#333333",
    color: "#aaaaaa",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  },
};

export const SearchPanel: React.FC<SearchPanelProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [records, setRecords] = useState<TabRecord[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<Array<{ name: string; color: string }>>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // 计算搜索结果（使用 useMemo 确保同步更新）
  const searchResults = React.useMemo(() => {
    console.log('[SearchPanel] Computing search results:', {
      totalRecords: records.length,
      selectedGroup,
      searchQuery,
    });

    let filtered = records;

    // 先按分组筛选
    if (selectedGroup) {
      filtered = filtered.filter((r) => r.groupName === selectedGroup);
      console.log('[SearchPanel] After group filter:', {
        selectedGroup,
        filteredCount: filtered.length,
      });
    }

    // 如果没有搜索词，直接返回筛选结果
    if (!searchQuery.trim()) {
      console.log('[SearchPanel] No search query, returning filtered results:', filtered.length);
      return filtered;
    }

    // 有搜索词时，使用 Fuse.js 模糊搜索
    const fuse = new Fuse(filtered, {
      keys: ["title", "url"],
      threshold: 0.3,
      ignoreLocation: true
    });
    const results = fuse.search(searchQuery).map((r) => r.item);
    console.log('[SearchPanel] Search results:', results.length);
    return results;
  }, [records, selectedGroup, searchQuery]);

  // 加载数据
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        // 从持久化数据库读取（包含所有历史标签组，不管是否还有打开的标签页）
        try {
          const response = await chrome.runtime.sendMessage({ type: 'GET_ALL_DATA' });
          const allRecords = response?.records || [];
          const groupList = response?.groups || [];
          console.log('[SearchPanel] Loaded', allRecords.length, 'records,', groupList.length, 'groups');
          setRecords(allRecords);
          setGroups(groupList);
        } catch (error) {
          console.error('[SearchPanel] Failed to load data:', error);
        }
      };

      loadData();

      return () => {};
    }
  }, [isOpen]);

  // 重置选中索引
  useEffect(() => setSelectedIndex(0), [searchResults]);

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

  const handleSync = async () => {
    // 确认提示：同步会完全替换为当前打开的标签页
    const confirmed = window.confirm(
      '同步将删除所有历史记录，只保留当前 Chrome 中实际打开的标签页。\n\n确定要同步吗？'
    );
    if (!confirmed) return;

    setIsSyncing(true);
    try {
      await chrome.runtime.sendMessage({ type: 'SYNC_TAB_GROUPS' });
      // 同步完成后重新加载数据
      const response = await chrome.runtime.sendMessage({ type: 'GET_ALL_DATA' });
      const allRecords = response?.records || [];
      const groupList = response?.groups || [];
      console.log('[SearchPanel] Synced and loaded', allRecords.length, 'records,', groupList.length, 'groups');
      setRecords(allRecords);
      setGroups(groupList);
    } catch (error) {
      console.error('[SearchPanel] Failed to sync:', error);
    } finally {
      setIsSyncing(false);
    }
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
          <button style={S.syncBtn} onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? '同步中...' : '⟳ 同步'}
          </button>
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
                key={record.id}
                style={S.item(index === selectedIndex)}
                onClick={() => handleOpenUrl(record.url)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={S.tag}>{record.groupName}</span>
                  <div style={S.itemTitle(index === selectedIndex)}>{record.title}</div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
