#!/bin/bash
# ============================================================================
# load-context.sh - 会话开始时加载项目上下文
# ============================================================================
# 触发事件: SessionStart
# 用途: 在会话开始时输出项目关键信息，帮助 AI 快速了解项目状态
# ============================================================================

set -euo pipefail

# 项目根目录（相对于 .claude/hooks/）
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DOCS_DIR="$PROJECT_ROOT/docs"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  JVibe 项目上下文加载${NC}"
echo -e "${BLUE}========================================${NC}"

# 检查文档目录是否存在
if [[ ! -d "$DOCS_DIR" ]]; then
    echo -e "${YELLOW}[提示] docs/ 目录不存在，跳过上下文加载${NC}"
    exit 0
fi

# 检查功能清单是否存在
FEATURE_LIST="$DOCS_DIR/功能清单.md"
if [[ -f "$FEATURE_LIST" ]]; then
    echo -e "\n${GREEN}📋 功能状态统计${NC}"
    echo "----------------------------------------"

    # 统计各状态数量
    COMPLETED=$(grep -c "^## F-[0-9]* ✅" "$FEATURE_LIST" 2>/dev/null || echo "0")
    IN_PROGRESS=$(grep -c "^## F-[0-9]* 🚧" "$FEATURE_LIST" 2>/dev/null || echo "0")
    NOT_STARTED=$(grep -c "^## F-[0-9]* ❌" "$FEATURE_LIST" 2>/dev/null || echo "0")
    TOTAL=$((COMPLETED + IN_PROGRESS + NOT_STARTED))

    if [[ $TOTAL -gt 0 ]]; then
        RATE=$((COMPLETED * 100 / TOTAL))
        echo "  ✅ 已完成: $COMPLETED"
        echo "  🚧 开发中: $IN_PROGRESS"
        echo "  ❌ 未开始: $NOT_STARTED"
        echo "  📊 完成率: $RATE%"
    else
        echo "  暂无功能条目"
    fi

    # 显示开发中的功能
    if [[ $IN_PROGRESS -gt 0 ]]; then
        echo -e "\n${YELLOW}🔨 当前开发中${NC}"
        echo "----------------------------------------"
        grep "^## F-[0-9]* 🚧" "$FEATURE_LIST" | sed 's/^## /  /' || true
    fi
else
    echo -e "${YELLOW}[提示] 功能清单.md 不存在${NC}"
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  上下文加载完成${NC}"
echo -e "${BLUE}========================================${NC}"

exit 0
