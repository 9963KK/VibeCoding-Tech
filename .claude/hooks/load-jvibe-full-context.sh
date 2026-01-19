#!/bin/bash
# ============================================================================
# load-jvibe-full-context.sh - SessionStart hook
# ============================================================================
# 触发事件: SessionStart（会话开始时）
# 用途: 加载完整的 JVibe 上下文（agents、commands、核心文档快照）
# 版本: 1.0
# ============================================================================

set -euo pipefail

# hook 必须 fail-open：任何异常都不应阻塞会话启动
fail_silent() {
    set +e
    # stdout 必须输出 JSON，避免 Hook Runner 解析失败
    printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":""}}'
    exit 0
}
trap fail_silent ERR

# 默认将人类可读输出打到 stderr，确保 stdout 仅输出 JSON（供 Hook Runner 解析）
log() {
    if [[ "${JVIBE_HOOK_VERBOSE:-1}" == "1" ]]; then
        echo -e "$*" >&2
    fi
}

# JSON 字符串转义（不依赖 jq）
json_escape() {
    local s="$1"
    s=${s//\\/\\\\}
    s=${s//\"/\\\"}
    s=${s//$'\n'/\\n}
    s=${s//$'\r'/\\r}
    s=${s//$'\t'/\\t}
    s=${s//$'\f'/\\f}
    s=${s//$'\b'/\\b}
    printf '"%s"' "$s"
}

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STATE_FILE="$PROJECT_ROOT/.jvibe-state.json"
HASH_FILE="$PROJECT_ROOT/.jvibe-doc-hash.json"
PLUGINS_FILE="$PROJECT_ROOT/docs/.jvibe/plugins.yaml"

# 检查 docs 目录位置
if [[ -d "$PROJECT_ROOT/docs/core" ]]; then
    DOCS_DIR="$PROJECT_ROOT/docs/core"
else
    DOCS_DIR="$PROJECT_ROOT/docs"
fi

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 检查是否为 JVibe 项目
is_jvibe_project() {
    [[ -f "$STATE_FILE" ]] || \
    [[ -f "$DOCS_DIR/Feature-List.md" ]] || \
    { [[ -f "$PROJECT_ROOT/.claude/settings.json" ]] && grep -q '"jvibe"' "$PROJECT_ROOT/.claude/settings.json" 2>/dev/null; }
}

# 计算文件 hash
calc_file_hash() {
    local file="$1"
    if [[ -f "$file" ]]; then
        md5 -q "$file" 2>/dev/null || md5sum "$file" 2>/dev/null | cut -d' ' -f1 || echo "no-hash"
    else
        echo "no-file"
    fi
}

# 从 plugins.yaml 中提取某个 list（仅支持一层: key: + "- item"）
extract_yaml_list() {
    local file="$1"
    local key="$2"

    if [[ ! -f "$file" ]]; then
        return 0
    fi

    awk -v key="$key" '
        function trim(s) {
            sub(/^[ \t\r\n]+/, "", s)
            sub(/[ \t\r\n]+$/, "", s)
            return s
        }
        {
            line=$0
            sub(/#.*/, "", line)
            line=trim(line)
            if (line=="") next

            if (line ~ ("^" key ":[[:space:]]*\\[\\][[:space:]]*$")) { in_list=0; next }
            if (line ~ ("^" key ":[[:space:]]*$")) { in_list=1; next }

            if (in_list==1) {
                if (line ~ "^[A-Za-z0-9_]+:[[:space:]]*") { in_list=0; next }
                if (line ~ "^-[[:space:]]*") {
                    sub(/^-+[[:space:]]*/, "", line)
                    line=trim(line)
                    if (line ~ /^"/) sub(/^"/, "", line)
                    if (line ~ /"$/) sub(/"$/, "", line)
                    if (line ~ /^'\''/) sub(/^'\''/, "", line)
                    if (line ~ /'\''$/) sub(/'\''$/, "", line)
                    if (line!="") print line
                }
            }
        }
    ' "$file"
}

describe_core_plugin() {
    local id="$1"
    case "$id" in
        serena) echo "Serena (memory, mcp) - 符号分析 + 项目记忆" ;;
        brave-search) echo "Brave Search (search, mcp) - 联网搜索" ;;
        filesystem-mcp) echo "Filesystem MCP (filesystem, mcp) - 基础文件操作" ;;
        github-mcp) echo "GitHub MCP (git, mcp) - Git/代码托管" ;;
        context7) echo "Context7 (docs, mcp) - 查询库/框架文档" ;;
        agent-browser) echo "Agent Browser (browser, daemon+skill) - 浏览器自动化" ;;
        *) echo "$id" ;;
    esac
}

# 获取 Core Tools 摘要（从 plugins.yaml 读取）
get_plugins_summary() {
    if [[ ! -f "$PLUGINS_FILE" ]]; then
        return
    fi

    local has_any=0
    echo "【Core Tools（plugins.yaml）】"
    while IFS= read -r plugin_id; do
        [[ -z "$plugin_id" ]] && continue
        has_any=1
        echo "  - $(describe_core_plugin "$plugin_id")"
    done < <(extract_yaml_list "$PLUGINS_FILE" "core_plugins")

    if [[ "$has_any" -ne 1 ]]; then
        echo "  - (未配置 core_plugins)"
    fi
}

# 保存当前文档 hash
save_doc_hashes() {
    local project_hash=$(calc_file_hash "$DOCS_DIR/Project.md")
    local feature_hash=$(calc_file_hash "$DOCS_DIR/Feature-List.md")
    local standards_hash=$(calc_file_hash "$DOCS_DIR/Standards.md")
    local appendix_hash=$(calc_file_hash "$DOCS_DIR/Appendix.md")

    local tmp_file=""
    tmp_file=$(mktemp 2>/dev/null || echo 0)
    if [[ -z "$tmp_file" ]]; then
        return 0
    fi

    cat > "$tmp_file" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "hashes": {
    "Project.md": "$project_hash",
    "Feature-List.md": "$feature_hash",
    "Standards.md": "$standards_hash",
    "Appendix.md": "$appendix_hash"
  }
}
EOF

    mv "$tmp_file" "$HASH_FILE" 2>/dev/null || cp "$tmp_file" "$HASH_FILE" 2>/dev/null || true
    rm -f "$tmp_file" 2>/dev/null || true
}

# 获取 agents 摘要
get_agents_summary() {
    local agents_dir="$PROJECT_ROOT/.claude/agents"
    if [[ ! -d "$agents_dir" ]]; then
        return
    fi

    echo "【可用 Agents】"
    for agent_file in "$agents_dir"/*.md; do
        if [[ -f "$agent_file" ]]; then
            local name=$(basename "$agent_file" .md)
            local desc=$(grep -m1 "^description:" "$agent_file" 2>/dev/null | sed 's/description: *//' || echo "")
            if [[ -n "$desc" ]]; then
                echo "  - $name: $desc"
            fi
        fi
    done
}

# 获取 commands 摘要
get_commands_summary() {
    local commands_dir="$PROJECT_ROOT/.claude/commands"
    if [[ ! -d "$commands_dir" ]]; then
        return
    fi

    echo "【可用 Commands】"
    for cmd_file in "$commands_dir"/*.md; do
        if [[ -f "$cmd_file" ]]; then
            local name=$(basename "$cmd_file" .md)
            # 从文件名提取命令名（如 JVibe:status.md -> /JVibe:status）
            echo "  - /$name"
        fi
    done
}

# 获取功能统计
get_feature_stats() {
    local feature_list="$DOCS_DIR/Feature-List.md"
    if [[ ! -f "$feature_list" ]]; then
        echo "  暂无功能清单"
        return
    fi

    local completed=$(grep -c "^## F-[0-9]* ✅" "$feature_list" 2>/dev/null || echo 0)
    local in_progress=$(grep -c "^## F-[0-9]* 🚧" "$feature_list" 2>/dev/null || echo 0)
    local not_started=$(grep -c "^## F-[0-9]* ❌" "$feature_list" 2>/dev/null || echo 0)
    local total=$((completed + in_progress + not_started))

    if [[ $total -gt 0 ]]; then
        local rate=$((completed * 100 / total))
        echo "  ✅ 已完成: $completed | 🚧 开发中: $in_progress | ❌ 未开始: $not_started"
        echo "  📊 完成率: ${rate}% ($completed/$total)"
    else
        echo "  暂无功能条目"
    fi
}

# 获取当前开发中的功能
get_in_progress_features() {
    local feature_list="$DOCS_DIR/Feature-List.md"
    if [[ ! -f "$feature_list" ]]; then
        return
    fi

    local features=$(grep "^## F-[0-9]* 🚧" "$feature_list" 2>/dev/null | sed 's/^## /  /' || echo 0)
    if [[ -n "$features" ]]; then
        echo "【当前开发中】"
        echo "$features"
    fi
}

# 获取核心文档摘要（用于 additionalContext）
get_core_docs_summary() {
    local summary=""

    # Project.md 摘要
    if [[ -f "$DOCS_DIR/Project.md" ]]; then
        summary+="=== Project.md 概要 ===\n"
        # 提取前 50 行或到第一个 ## 之前
        summary+=$(head -50 "$DOCS_DIR/Project.md" | grep -v "^#" | head -20)
        summary+="\n\n"
    fi

    # Feature-List.md 摘要（仅统计和开发中功能）
    if [[ -f "$DOCS_DIR/Feature-List.md" ]]; then
        summary+="=== Feature-List.md 概要 ===\n"
        summary+="$(get_feature_stats)\n"
        local in_progress=$(grep "^## F-[0-9]* 🚧" "$DOCS_DIR/Feature-List.md" 2>/dev/null || echo 0)
        if [[ -n "$in_progress" ]]; then
            summary+="开发中功能:\n$in_progress\n"
        fi
        summary+="\n"
    fi

    # Standards.md 摘要（仅章节标题）
    if [[ -f "$DOCS_DIR/Standards.md" ]]; then
        summary+="=== Standards.md 章节 ===\n"
        summary+=$(grep "^##" "$DOCS_DIR/Standards.md" 2>/dev/null | head -10 || echo "无")
        summary+="\n\n"
    fi

    # Appendix.md 摘要（仅规范条目ID）
    if [[ -f "$DOCS_DIR/Appendix.md" ]]; then
        summary+="=== Appendix.md 规范条目 ===\n"
        summary+=$(grep -E "^## [A-Z]+-[0-9]+" "$DOCS_DIR/Appendix.md" 2>/dev/null | head -10 || echo "无")
        summary+="\n"
    fi

    echo -e "$summary"
}

# ============================================================================
# 主逻辑
# ============================================================================

# 非 JVibe 项目，静默退出
if ! is_jvibe_project; then
    exit 0
fi

# 控制台输出（用户可见）
log "${BLUE}========================================${NC}"
log "${BLUE}  JVibe 项目上下文加载${NC}"
log "${BLUE}========================================${NC}"

log "\n${GREEN}📋 功能状态${NC}"
log "----------------------------------------"
get_feature_stats >&2

get_in_progress_features >&2

log ""
get_agents_summary >&2

log ""
get_commands_summary >&2

log "\n${BLUE}========================================${NC}"
log "${BLUE}  上下文加载完成${NC}"
log "${BLUE}========================================${NC}"

# 保存文档 hash（供 UserPromptSubmit 检测变更）
save_doc_hashes

# JSON 输出（注入 additionalContext）
# 构建完整的 JVibe 上下文
AGENTS_SUMMARY=$(get_agents_summary)
COMMANDS_SUMMARY=$(get_commands_summary)
DOCS_SUMMARY=$(get_core_docs_summary)
PLUGINS_SUMMARY=$(get_plugins_summary)

FULL_CONTEXT="<jvibe-session-context>
【JVibe 项目已加载】

$AGENTS_SUMMARY

$COMMANDS_SUMMARY

$PLUGINS_SUMMARY

【核心文档快照】
$DOCS_SUMMARY

【使用提示】
- 使用自然语言描述需求，我会自动调用合适的 agent
- /JVibe:status 查看项目状态
- /JVibe:keepgo 继续推进任务
- /JVibe:pr 生成 PR 描述
</jvibe-session-context>"

# 输出 JSON（additionalContext 注入到 AI 上下文）
ESCAPED_CONTEXT=$(json_escape "$FULL_CONTEXT")

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": $ESCAPED_CONTEXT
  }
}
EOF

exit 0
