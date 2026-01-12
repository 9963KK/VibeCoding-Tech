#!/bin/bash
# ============================================================================
# sync-stats.sh - Agent 完成后输出项目统计信息
# ============================================================================
# 触发事件: Stop
# 用途: 在 Agent 完成工作后，输出项目功能统计数据供用户参考
# ============================================================================

set -euo pipefail

# 项目根目录（相对于 .claude/hooks/）
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if [[ -d "$PROJECT_ROOT/docs/core" ]]; then
    DOCS_DIR="$PROJECT_ROOT/docs/core"
else
    DOCS_DIR="$PROJECT_ROOT/docs"
fi
FEATURE_LIST="$DOCS_DIR/功能清单.md"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 检查功能清单是否存在
if [[ ! -f "$FEATURE_LIST" ]]; then
    exit 0
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  📊 项目统计信息${NC}"
echo -e "${BLUE}========================================${NC}"

count_status() {
    local pattern=$1
    awk -v re="$pattern" 'BEGIN{c=0} $0 ~ re {c++} END{print c+0}' "$FEATURE_LIST"
}

# 统计各状态数量（避免 grep 输出异常导致算术错误）
COMPLETED=$(count_status "^## F-[0-9]* ✅")
IN_PROGRESS=$(count_status "^## F-[0-9]* 🚧")
NOT_STARTED=$(count_status "^## F-[0-9]* ❌")

TOTAL=$((COMPLETED + IN_PROGRESS + NOT_STARTED))

if [[ $TOTAL -eq 0 ]]; then
    echo "  暂无功能条目"
    echo -e "${BLUE}========================================${NC}"
    exit 0
fi

# 计算完成率
RATE=$((COMPLETED * 100 / TOTAL))

# 输出总体统计
echo -e "\n${CYAN}功能总览${NC}"
echo "----------------------------------------"
echo "  总功能数: $TOTAL"
echo "  ✅ 已完成: $COMPLETED"
echo "  🚧 开发中: $IN_PROGRESS"
echo "  ❌ 未开始: $NOT_STARTED"
echo "  📈 完成率: $RATE%"

# 按模块统计（如果项目文档存在）
PROJECT_DOC="$DOCS_DIR/项目文档.md"
if [[ -f "$PROJECT_DOC" ]]; then
    echo -e "\n${CYAN}模块统计${NC}"
    echo "----------------------------------------"

    # 从项目文档读取模块列表
    # 假设模块定义在功能清单中：## F-XXX [状态] 功能名称 [模块名]
    # 或者从功能描述中提取

    # 简化版本：直接从功能清单提取所有功能的模块信息（如果有的话）
    # 这里我们先输出一个占位符，实际实现可以更复杂

    echo "  (模块统计需要在项目文档中配置)"
fi

# 显示最近更新的功能
echo -e "\n${CYAN}最近活跃${NC}"
echo "----------------------------------------"

# 显示最近 3 个状态为 🚧 的功能
RECENT_IN_PROGRESS=$(grep "^## F-[0-9]* 🚧" "$FEATURE_LIST" | head -n 3)
if [[ -n "$RECENT_IN_PROGRESS" ]]; then
    echo "$RECENT_IN_PROGRESS" | while IFS= read -r line; do
        # 提取功能编号和名称
        if [[ "$line" =~ ^##[[:space:]]+(F-[0-9]+)[[:space:]]+🚧[[:space:]]+(.+)$ ]]; then
            feature_id="${BASH_REMATCH[1]}"
            feature_name="${BASH_REMATCH[2]}"
            echo "  🚧 $feature_id: $feature_name"
        fi
    done
fi

# 显示最近完成的功能（最多 3 个）
RECENT_COMPLETED=$(grep "^## F-[0-9]* ✅" "$FEATURE_LIST" | tail -n 3)
if [[ -n "$RECENT_COMPLETED" ]]; then
    echo "$RECENT_COMPLETED" | while IFS= read -r line; do
        if [[ "$line" =~ ^##[[:space:]]+(F-[0-9]+)[[:space:]]+✅[[:space:]]+(.+)$ ]]; then
            feature_id="${BASH_REMATCH[1]}"
            feature_name="${BASH_REMATCH[2]}"
            echo "  ✅ $feature_id: $feature_name"
        fi
    done
fi

echo -e "\n${BLUE}========================================${NC}"

exit 0
