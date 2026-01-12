#!/bin/bash
# ============================================================================
# sync-feature-status.sh - 自动推导功能状态
# ============================================================================
# 触发事件: PostToolUse (matcher: Edit|Write)
# 用途: 当功能清单被修改时，根据 TODO 完成情况自动推导功能状态
# ============================================================================
# 状态推导规则:
#   - 0/N 完成 → ❌ 未开始
#   - 1~(N-1)/N 完成 → 🚧 开发中
#   - N/N 完成 → ✅ 已完成
# ============================================================================

set -euo pipefail

# 从 stdin 读取 hook 输入（JSON 格式）
INPUT=$(cat)

# 解析文件路径
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "")

# 只处理功能清单文件
if [[ "$FILE_PATH" != *"docs/core/Feature-List.md" && "$FILE_PATH" != *"docs/Feature-List.md" ]]; then
    exit 0
fi

# 检查文件是否存在
if [[ ! -f "$FILE_PATH" ]]; then
    exit 0
fi

echo "[sync-feature-status] 检测到功能清单变更，开始同步状态..."

# 创建临时文件
TEMP_FILE=$(mktemp)
trap "rm -f $TEMP_FILE" EXIT

# 标记是否有状态变更
CHANGES_MADE=false

# 逐行处理文件
current_feature=""
current_status=""
todo_total=0
todo_completed=0

while IFS= read -r line || [[ -n "$line" ]]; do
    # 检测功能标题行: ## F-XXX [状态] 功能名称
    if [[ "$line" =~ ^##[[:space:]]+(F-[0-9]+)[[:space:]]+(✅|🚧|❌)[[:space:]]+(.+)$ ]]; then
        # 处理上一个功能的状态（如果有）
        if [[ -n "$current_feature" ]]; then
            # 推导状态
            if [[ $todo_total -eq 0 ]]; then
                new_status="❌"
            elif [[ $todo_completed -eq 0 ]]; then
                new_status="❌"
            elif [[ $todo_completed -eq $todo_total ]]; then
                new_status="✅"
            else
                new_status="🚧"
            fi

            # 如果状态需要更新，记录变更
            if [[ "$new_status" != "$current_status" ]]; then
                echo "[sync-feature-status] $current_feature: $current_status → $new_status ($todo_completed/$todo_total)"
                CHANGES_MADE=true
            fi
        fi

        # 记录当前功能信息
        current_feature="${BASH_REMATCH[1]}"
        current_status="${BASH_REMATCH[2]}"
        feature_name="${BASH_REMATCH[3]}"
        todo_total=0
        todo_completed=0

        echo "$line" >> "$TEMP_FILE"

    # 检测 TODO 项: - [ ] 或 - [x]
    elif [[ "$line" =~ ^[[:space:]]*-[[:space:]]\[([ xX])\] ]]; then
        ((todo_total++)) || true
        if [[ "${BASH_REMATCH[1]}" =~ [xX] ]]; then
            ((todo_completed++)) || true
        fi
        echo "$line" >> "$TEMP_FILE"

    # 其他行直接输出
    else
        echo "$line" >> "$TEMP_FILE"
    fi
done < "$FILE_PATH"

# 处理最后一个功能
if [[ -n "$current_feature" ]]; then
    if [[ $todo_total -eq 0 ]]; then
        new_status="❌"
    elif [[ $todo_completed -eq 0 ]]; then
        new_status="❌"
    elif [[ $todo_completed -eq $todo_total ]]; then
        new_status="✅"
    else
        new_status="🚧"
    fi

    if [[ "$new_status" != "$current_status" ]]; then
        echo "[sync-feature-status] $current_feature: $current_status → $new_status ($todo_completed/$todo_total)"
        CHANGES_MADE=true
    fi
fi

# 如果有状态变更，更新文件
if [[ "$CHANGES_MADE" == "true" ]]; then
    # 重新处理文件，这次真正更新状态（避免嵌套读取同一流）
    mapfile -t lines < "$FILE_PATH"
    > "$TEMP_FILE"
    total_lines=${#lines[@]}

    for ((i=0; i<total_lines; i++)); do
        line="${lines[i]}"

        # 检测功能标题行
        if [[ "$line" =~ ^##[[:space:]]+(F-[0-9]+)[[:space:]]+(✅|🚧|❌)[[:space:]]+(.+)$ ]]; then
            current_feature="${BASH_REMATCH[1]}"
            feature_name="${BASH_REMATCH[3]}"

            temp_total=0
            temp_completed=0

            # 扫描该功能的所有 TODO（从内存数组读取）
            for ((j=i+1; j<total_lines; j++)); do
                next_line="${lines[j]}"
                if [[ "$next_line" =~ ^##[[:space:]] ]]; then
                    break
                fi
                if [[ "$next_line" =~ ^[[:space:]]*-[[:space:]]\[([ xX])\] ]]; then
                    ((temp_total++)) || true
                    if [[ "${BASH_REMATCH[1]}" =~ [xX] ]]; then
                        ((temp_completed++)) || true
                    fi
                fi
            done

            # 推导新状态
            if [[ $temp_total -eq 0 ]]; then
                new_status="❌"
            elif [[ $temp_completed -eq 0 ]]; then
                new_status="❌"
            elif [[ $temp_completed -eq $temp_total ]]; then
                new_status="✅"
            else
                new_status="🚧"
            fi

            # 输出更新后的标题行
            printf '## %s %s %s\n' "$current_feature" "$new_status" "$feature_name" >> "$TEMP_FILE"
        else
            printf '%s\n' "$line" >> "$TEMP_FILE"
        fi
    done

    # 备份原文件并更新
    cp "$FILE_PATH" "${FILE_PATH}.bak"
    mv "$TEMP_FILE" "$FILE_PATH"
    echo "[sync-feature-status] 状态同步完成"
else
    echo "[sync-feature-status] 无状态变更"
fi

exit 0
