#!/bin/bash
# ============================================================================
# load-context.sh - 会话开始时加载项目上下文
# ============================================================================
# 触发事件: SessionStart
# 用途: 在会话开始时输出项目关键信息,帮助 AI 快速了解项目状态
# 版本: 2.0 - 支持状态标记机制
# ============================================================================

set -euo pipefail

# 项目根目录（相对于 .claude/hooks/）
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DOCS_DIR="$PROJECT_ROOT/docs"
STATE_FILE="$PROJECT_ROOT/.jvibe-state.json"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 读取状态文件
read_state() {
    if [[ -f "$STATE_FILE" ]]; then
        cat "$STATE_FILE"
    else
        echo '{"initialized":false,"firstSessionAfterInit":false}'
    fi
}

# 更新状态文件
update_state() {
    local key=$1
    local value=$2
    local state=$(read_state)
    echo "$state" | jq --arg key "$key" --arg value "$value" '.[$key] = ($value | fromjson)' > "$STATE_FILE"
}

# 检查是否已初始化
STATE=$(read_state)
INITIALIZED=$(echo "$STATE" | jq -r '.initialized // false')
FIRST_SESSION=$(echo "$STATE" | jq -r '.firstSessionAfterInit // false')

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  JVibe 项目上下文加载${NC}"
echo -e "${BLUE}========================================${NC}"

# 未初始化：简洁提示
if [[ "$INITIALIZED" == "false" ]]; then
    echo -e "${YELLOW}[提示] 功能清单.md 不存在${NC}"
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}  上下文加载完成${NC}"
    echo -e "${BLUE}========================================${NC}"
    exit 0
fi

# 首次会话：显示欢迎信息
if [[ "$FIRST_SESSION" == "true" ]]; then
    echo -e "\n${GREEN}✅ JVibe 项目已初始化！${NC}"
    echo "----------------------------------------"
    echo "  使用自然语言添加功能"
    echo "  使用 /JVibe:status 查看项目状态"
    echo "  使用 /JVibe:pr 生成 PR 描述"

    # 更新状态：标记为非首次会话
    update_state "firstSessionAfterInit" "false"
fi

# 常规会话：显示功能统计（如果功能清单存在）
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
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  上下文加载完成${NC}"
echo -e "${BLUE}========================================${NC}"

exit 0
