#!/bin/bash
# ============================================================================
# sync-jvibe-context.sh - UserPromptSubmit hook
# ============================================================================
# 触发事件: UserPromptSubmit（每次用户提交 prompt 时）
# 用途: 检测核心文档变更，按需注入更新内容
# 版本: 1.0
# ============================================================================

set -euo pipefail

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STATE_FILE="$PROJECT_ROOT/.jvibe-state.json"
HASH_FILE="$PROJECT_ROOT/.jvibe-doc-hash.json"

# 检查 docs 目录位置
if [[ -d "$PROJECT_ROOT/docs/core" ]]; then
    DOCS_DIR="$PROJECT_ROOT/docs/core"
else
    DOCS_DIR="$PROJECT_ROOT/docs"
fi

# 检查是否为 JVibe 项目
is_jvibe_project() {
    [[ -f "$STATE_FILE" ]] || \
    [[ -f "$DOCS_DIR/Feature-List.md" ]] || \
    [[ -f "$PROJECT_ROOT/.claude/settings.json" && $(jq -e '.jvibe' "$PROJECT_ROOT/.claude/settings.json" 2>/dev/null) ]]
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

# 初始化 hash 文件（避免首次缺失导致每次都判定“已更新”）
init_doc_hashes() {
    local project_hash=$(calc_file_hash "$DOCS_DIR/Project.md")
    local feature_hash=$(calc_file_hash "$DOCS_DIR/Feature-List.md")
    local standards_hash=$(calc_file_hash "$DOCS_DIR/Standards.md")
    local appendix_hash=$(calc_file_hash "$DOCS_DIR/Appendix.md")

    cat > "$HASH_FILE" <<EOF
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
}

# 获取上次保存的 hash
get_saved_hash() {
    local doc_name="$1"
    if [[ -f "$HASH_FILE" ]]; then
        jq -r ".hashes[\"$doc_name\"] // \"no-saved\"" "$HASH_FILE" 2>/dev/null || echo "no-saved"
    else
        echo "no-saved"
    fi
}

# 更新保存的 hash
update_saved_hash() {
    local doc_name="$1"
    local new_hash="$2"

    if [[ -f "$HASH_FILE" ]]; then
        local tmp_file=$(mktemp)
        jq ".hashes[\"$doc_name\"] = \"$new_hash\" | .timestamp = \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"" "$HASH_FILE" > "$tmp_file"
        mv "$tmp_file" "$HASH_FILE"
    fi
}

# 检测哪些文档发生了变更
detect_changes() {
    local changed_docs=""
    local docs=("Project.md" "Feature-List.md" "Standards.md" "Appendix.md")

    for doc in "${docs[@]}"; do
        local file_path="$DOCS_DIR/$doc"
        local current_hash=$(calc_file_hash "$file_path")
        local saved_hash=$(get_saved_hash "$doc")

        if [[ "$current_hash" != "$saved_hash" && "$current_hash" != "no-file" ]]; then
            if [[ -n "$changed_docs" ]]; then
                changed_docs="$changed_docs $doc"
            else
                changed_docs="$doc"
            fi
            # 更新 hash
            update_saved_hash "$doc" "$current_hash"
        fi
    done

    echo "$changed_docs"
}

# 获取文档摘要
get_doc_summary() {
    local doc_name="$1"
    local file_path="$DOCS_DIR/$doc_name"

    if [[ ! -f "$file_path" ]]; then
        return
    fi

    case "$doc_name" in
        "Project.md")
            echo "=== Project.md 更新 ==="
            # 提取项目概述部分
            head -30 "$file_path" | grep -v "^#" | head -15
            ;;
        "Feature-List.md")
            echo "=== Feature-List.md 更新 ==="
            # 统计 + 开发中功能
            local completed=$(grep -c "^## F-[0-9]* ✅" "$file_path" 2>/dev/null || echo "0")
            local in_progress=$(grep -c "^## F-[0-9]* 🚧" "$file_path" 2>/dev/null || echo "0")
            local not_started=$(grep -c "^## F-[0-9]* ❌" "$file_path" 2>/dev/null || echo "0")
            echo "状态: ✅$completed 🚧$in_progress ❌$not_started"
            # 列出开发中的功能
            grep "^## F-[0-9]* 🚧" "$file_path" 2>/dev/null | head -5 || true
            ;;
        "Standards.md")
            echo "=== Standards.md 更新 ==="
            # 列出章节
            grep "^##" "$file_path" 2>/dev/null | head -8 || echo "无"
            ;;
        "Appendix.md")
            echo "=== Appendix.md 更新 ==="
            # 列出规范条目
            grep -E "^## [A-Z]+-[0-9]+" "$file_path" 2>/dev/null | head -8 || echo "无"
            ;;
    esac
}

# 获取轻量级状态信息（无变更时使用）
get_lightweight_status() {
    local feature_list="$DOCS_DIR/Feature-List.md"

    if [[ ! -f "$feature_list" ]]; then
        return
    fi

    local completed=$(grep -c "^## F-[0-9]* ✅" "$feature_list" 2>/dev/null || echo "0")
    local in_progress=$(grep -c "^## F-[0-9]* 🚧" "$feature_list" 2>/dev/null || echo "0")
    local not_started=$(grep -c "^## F-[0-9]* ❌" "$feature_list" 2>/dev/null || echo "0")
    local total=$((completed + in_progress + not_started))

    if [[ $total -gt 0 ]]; then
        local rate=$((completed * 100 / total))
        echo "功能状态: ✅$completed 🚧$in_progress ❌$not_started (${rate}%)"
    fi
}

# ============================================================================
# 主逻辑
# ============================================================================

# 非 JVibe 项目，直接放行
if ! is_jvibe_project; then
    echo '{"decision": "allow"}'
    exit 0
fi

# 若 hash 文件缺失，先初始化（不注入“更新”，避免首轮噪声）
if [[ ! -f "$HASH_FILE" ]]; then
    init_doc_hashes
fi

# 检测文档变更
CHANGED_DOCS=$(detect_changes)

# 构建上下文
CONTEXT=""

if [[ -n "$CHANGED_DOCS" ]]; then
    # 有变更，注入更新内容
    CONTEXT+="<jvibe-doc-update>\n"
    CONTEXT+="【核心文档已更新】\n\n"

    for doc in $CHANGED_DOCS; do
        CONTEXT+="$(get_doc_summary "$doc")\n\n"
    done

    CONTEXT+="</jvibe-doc-update>"
else
    # 无变更，仅注入轻量状态（约 20 tokens）
    STATUS=$(get_lightweight_status)
    if [[ -n "$STATUS" ]]; then
        CONTEXT="<jvibe-status>$STATUS</jvibe-status>"
    fi
fi

# 输出 JSON
if [[ -n "$CONTEXT" ]]; then
    ESCAPED_CONTEXT=$(echo -e "$CONTEXT" | jq -Rs '.')
    cat <<EOF
{
  "decision": "allow",
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": $ESCAPED_CONTEXT
  }
}
EOF
else
    echo '{"decision": "allow"}'
fi

exit 0
