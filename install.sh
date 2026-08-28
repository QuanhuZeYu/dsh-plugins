#!/usr/bin/env bash
# dsh 分享插件安装脚本（macOS / Linux）
# 用法: bash install.sh [DSH_AI_DIR=<@deepseek-ai 目录>]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOME_DIR="${DSH_HOME:-$HOME/.dsh}"
PROFILE="${PROFILE:-web}"

echo ""
echo "== dsh 分享插件安装 =="

# ── 1. 定位 dsh 安装树的 @deepseek-ai 目录 ──
find_ai_dir() {
  [ -n "${DSH_AI_DIR:-}" ] && [ -d "$DSH_AI_DIR/dsh-base" ] && { echo "$DSH_AI_DIR"; return; }
  local start cur cand
  for start in "$SCRIPT_DIR" "$PWD"; do
    cur="$start"
    while [ -n "$cur" ]; do
      cand="$cur/apps/cli/node_modules/@deepseek-ai"
      [ -d "$cand/dsh-base" ] && { echo "$cand"; return; }
      [ "$cur" = "$(dirname "$cur")" ] && break
      cur="$(dirname "$cur")"
    done
  done
  return 1
}

AI_DIR="$(find_ai_dir || true)"
if [ -z "$AI_DIR" ]; then
  echo "无法自动定位 node_modules/@deepseek-ai，请设置 DSH_AI_DIR 后重试。" >&2
  echo "例如: DSH_AI_DIR=/path/to/deepseek-harness/apps/cli/node_modules/@deepseek-ai bash install.sh" >&2
  exit 1
fi
echo "[1/4] @deepseek-ai 目录: $AI_DIR"

# ── 2. 复制两个插件包 ──
for p in dsh-client-ui-model-tag dsh-subagent-effort-in-process; do
  src="$SCRIPT_DIR/plugins/$p"
  [ -d "$src" ] || { echo "缺少 $src，跳过" >&2; continue; }
  rm -rf "$AI_DIR/$p"
  cp -R "$src" "$AI_DIR/$p"
  echo "[2/4] 已安装插件包: $p"
done

# ── 3. browser 插件: 确保 profiles 树可见 ──
PROFILES_AI="$HOME_DIR/profiles/node_modules/@deepseek-ai"
UI_TARGET="$AI_DIR/dsh-client-ui-model-tag"
UI_LINK="$PROFILES_AI/dsh-client-ui-model-tag"
if [ -d "$UI_TARGET" ] && [ ! -e "$UI_LINK" ]; then
  mkdir -p "$PROFILES_AI"
  ln -s "$UI_TARGET" "$UI_LINK" 2>/dev/null || cp -R "$UI_TARGET" "$UI_LINK"
  echo "[3/4] 已建立 profiles 树链接: dsh-client-ui-model-tag"
else
  echo "[3/4] profiles 树已有 dsh-client-ui-model-tag，跳过"
fi

# ── 4. 追加 patch（幂等） ──
PATCH_PATH="$HOME_DIR/profiles/$PROFILE/cordis.patch.yml"
BLOCK='
# 分享插件：Per-message model/effort 标签 + 子代理 reasoning-effort 透传（install.sh 安装）
- insert:
    - id: ui-model-effort-tag
      name: '@deepseek-ai/dsh-client-ui-model-tag'
    - id: subagent-effort-in-process
      name: '@deepseek-ai/dsh-subagent-effort-in-process'
'
if [ -f "$PATCH_PATH" ] && grep -q 'ui-model-effort-tag' "$PATCH_PATH" && grep -q 'subagent-effort-in-process' "$PATCH_PATH"; then
  echo "[4/4] patch 已包含两个插件行，跳过"
else
  mkdir -p "$(dirname "$PATCH_PATH")"
  printf '%s\n' "$BLOCK" >> "$PATCH_PATH"
  echo "[4/4] 已追加挂载行: $PATCH_PATH"
fi

echo ""
echo "安装完成。请退出当前运行的 dsh 实例后重新启动生效。"
