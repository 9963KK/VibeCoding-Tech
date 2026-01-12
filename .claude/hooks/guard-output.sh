#!/bin/bash
# ============================================================================
# guard-output.sh - output size guard
# ============================================================================
# Trigger: Stop
# Purpose: warn on long output without structured fenced blocks
# ============================================================================

set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

INPUT=$(cat || true)
if [[ -z "${INPUT//[[:space:]]/}" ]]; then
  exit 0
fi

extract_text() {
  jq -r '
    def totext:
      if type=="string" then .
      elif type=="array" then (map(totext) | join("\n"))
      elif type=="object" then
        if has("text") then .text
        elif has("content") then .content | totext
        else empty end
      else empty end;

    .response
    // .message
    // .output
    // .final_response
    // .final
    // .assistant
    // .content
    // .messages[-1]
    // empty
    | totext
  ' 2>/dev/null
}

TEXT=$(printf '%s' "$INPUT" | extract_text || true)
if [[ -z "${TEXT//[[:space:]]/}" ]]; then
  exit 0
fi

max_lines=${JVIBE_OUTPUT_MAX_LINES:-12}
line_count=$(printf '%s' "$TEXT" | wc -l | tr -d ' ')
has_block=$(printf '%s' "$TEXT" | grep -E -m1 '```(jvibe|yaml|yml|json)' || true)

if [[ "$line_count" -gt "$max_lines" && -z "$has_block" ]]; then
  echo "[jvibe] Output too long (${line_count} lines). Use a fenced structured block (```jvibe|yaml|json) and keep it <= ${max_lines} lines."
fi

exit 0
