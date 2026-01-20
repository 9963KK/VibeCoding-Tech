/**
 * JVibe TUI Setup
 * 终端交互式配置入口（方向键 + Enter）
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const init = require('./init');
const { configureClaudeCoreTools } = require('../lib/plugins/core-tools');
const { stripYamlComment, parsePluginListsFromYaml } = require('../lib/plugins/plugins-yaml');

const KEY = {
  UP: '\u001b[A',
  DOWN: '\u001b[B',
  LEFT: '\u001b[D',
  RIGHT: '\u001b[C',
  ENTER: '\r',
  ESC: '\u001b',
  CTRL_C: '\u0003'
};

/* ASCII Art for "JVIBE" */
const TITLE_BANNER = [
  "   _  _     _  ___  ____  _____ ",
  "  | || |   | ||_ _|| __ )| ____|",
  "  | || |   | | | | |  _ \\|  _|  ",
  "  |_|\\ \\   / / | | | |_) | |___ ",
  "  (_) \\_\\_/_/ |___||____/|_____|"
];

// Localization Dictionary
const I18N = {
  en: {
    subtitle: "Doc-driven AI Assisted Development",
    website: "Web: https://github.com/9963KK/VibeCoding-Tech",
    setupWizard: "Setup Wizard",
    project: "Project",
    state: "State",
    detect: "Detect",
    cli: "CLI",

    // Step Titles
    stepAdapter: "Step 1: Select Adapters",
    stepMode: "Step 2: Installation Mode",
    stepPlugins: "Step 3: Project Plugins",
    stepAdvanced: "Step 4: Advanced Options",

    // Instructions
    instructions: "↑↓ Select | Enter Toggle | ◀ ▶ Nav",

    // Items
    claudeAdapter: "Claude Code Adapter",
    opencodeAdapter: "OpenCode Adapter",
    fullMode: "Full Mode (Complete Docs)",
    minimalMode: "Minimal Mode (Core Only)",
    forceOverwrite: "Force Overwrite",
    noProjectPlugins: "(No Project Plugins in registry)",

    // Actions
    next: "Next",
    back: "Back",
    preview: "Preview",
    exit: "Exit",

    previewChanges: "Preview Changes",
    directoriesToCreate: "Directories to Create:",
    noChanges: "  (No changes to config directories)",
    pluginsSummary: "Project Plugins:",
    pluginsNone: "  (None selected)",
    validationIssues: "Validation Issues:",
    warnings: "Warnings:",
    readyToInit: "Ready to Initialize",
    confirmApply: "Confirm & Apply",
    error: "Error",
    pressEnter: "[ Press Enter to return ]",
    selectLang: "Please Select Language / 请选择语言",
    selectLangInst: "↑↓ Select | Enter Confirm",

    errSelectAdapter: "Select at least one adapter.",
    errClaudeExists: "Claude config exists. Enable Force or deselect.",
    errOpencodeExists: "OpenCode config exists. Enable Force or deselect.",
    warnClaudeCLI: "Claude CLI not found in PATH.",
    warnOpenCodeCLI: "OpenCode CLI not found in PATH.",
    hintPluginsPlanned: "Plugin system is planned; this wizard writes selection to docs/.jvibe/plugins.yaml but does NOT install/update tools automatically.",
    hintPluginsExistingConfig: "Existing docs/.jvibe/plugins.yaml detected; project_plugins will be updated. Enable Force Overwrite to fully reset the file."
  },
  zh: {
    subtitle: "文档驱动的 AI 辅助开发系统",
    website: "官网: https://github.com/9963KK/VibeCoding-Tech",
    setupWizard: "配置向导",
    project: "当前项目",
    state: "状态",
    detect: "检测",
    cli: "CLI",

    // Step Titles
    stepAdapter: "步骤 1: 选择适配器",
    stepMode: "步骤 2: 安装模式",
    stepPlugins: "步骤 3: 项目插件",
    stepAdvanced: "步骤 4: 高级选项",

    // Instructions
    instructions: "↑↓ 选择 | Enter 切换 | ◀ ▶ 导航",

    // Items
    claudeAdapter: "Claude Code 适配器",
    opencodeAdapter: "OpenCode 适配器",
    fullMode: "完整模式 (包含项目文档)",
    minimalMode: "最小模式 (仅核心文档)",
    forceOverwrite: "强制覆盖现有配置",
    noProjectPlugins: "（工具库中暂无可选项目插件）",

    // Actions
    next: "下一步",
    back: "上一步",
    preview: "预览",
    exit: "退出",

    previewChanges: "预览更改",
    directoriesToCreate: "即将创建的目录:",
    noChanges: "  (配置目录无变更)",
    pluginsSummary: "项目插件:",
    pluginsNone: "  (未选择)",
    validationIssues: "验证问题:",
    warnings: "警告:",
    readyToInit: "准备就绪，可以初始化",
    confirmApply: "确认并应用",
    error: "错误",
    pressEnter: "[ 按 Enter 键返回 ]",
    selectLang: "Please Select Language / 请选择语言",
    selectLangInst: "↑↓ Select | Enter Confirm",

    errSelectAdapter: "请至少选择一个适配器。",
    errClaudeExists: "Claude 配置已存在。请勾选强制覆盖或取消选择。",
    errOpencodeExists: "OpenCode 配置已存在。请勾选强制覆盖或取消选择。",
    warnClaudeCLI: "未在 PATH 中找到 Claude CLI。",
    warnOpenCodeCLI: "未在 PATH 中找到 OpenCode CLI。",
    hintPluginsPlanned: "插件系统仍在规划中；向导会写入 docs/.jvibe/plugins.yaml 的启用清单，但不会自动安装/更新工具。",
    hintPluginsExistingConfig: "检测到已存在 docs/.jvibe/plugins.yaml；将更新 project_plugins。勾选强制覆盖可重置整个文件。"
  }
};

const DEFAULT_CORE_PLUGINS = [
  'serena',
  'filesystem-mcp',
  'github-mcp',
  'context7',
  'agent-browser'
];

const MAX_VISIBLE_ITEMS = 12;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function areSetsEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.size !== b.size) return false;
  for (const value of a) {
    if (!b.has(value)) return false;
  }
  return true;
}

function updateYamlListInContent(content, key, items) {
  const lines = content.split(/\r?\n/);
  const keyPrefix = `${key}:`;
  let keyIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const stripped = stripYamlComment(lines[i]).trimStart();
    if (stripped.startsWith(keyPrefix)) {
      keyIndex = i;
      break;
    }
  }

  const makeBlock = (indent) => {
    if (!items || items.length === 0) {
      return [`${indent}${key}: []`];
    }
    return [`${indent}${key}:`, ...items.map(item => `${indent}  - ${item}`)];
  };

  if (keyIndex === -1) {
    const appended = [...lines];
    if (appended.length > 0 && appended[appended.length - 1].trim() !== '') {
      appended.push('');
    }
    appended.push(...makeBlock(''));
    appended.push('');
    return appended.join('\n');
  }

  const indentMatch = lines[keyIndex].match(/^(\s*)/);
  const keyIndent = indentMatch ? indentMatch[1] : '';
  let endIndex = keyIndex + 1;

  for (; endIndex < lines.length; endIndex++) {
    const currentLine = stripYamlComment(lines[endIndex]);
    if (currentLine.trim() === '') {
      break;
    }
    const currentIndentMatch = currentLine.match(/^(\s*)/);
    const currentIndent = currentIndentMatch ? currentIndentMatch[1] : '';
    if (currentIndent.length <= keyIndent.length) {
      break;
    }
  }

  lines.splice(keyIndex, endIndex - keyIndex, ...makeBlock(keyIndent));
  return lines.join('\n');
}

function formatPluginsYaml(corePlugins, projectPlugins) {
  const lines = [];
  lines.push('version: 1');
  lines.push('');
  lines.push('# Core Tools（推荐默认启用；代表“期望可用”，不是“必须可用”）');
  lines.push('# - 这些插件可能需要额外配置（如 API Key / MCP Server / Daemon）');
  lines.push('# - 若某项不可用：系统应降级为提示，不应阻塞主流程');
  lines.push('core_plugins:');
  if (corePlugins.length === 0) {
    lines[lines.length - 1] += ' []';
  } else {
    corePlugins.forEach(id => lines.push(`  - ${id}`));
  }
  lines.push('');
  lines.push('# Project Tools（按项目选择；只写“启用哪些插件”，不在这里存任何密钥/Token）');
  lines.push('# 插件系统仍在规划中：本文件当前主要用于“记录选择”，具体安装/更新由用户手动完成。');
  lines.push('project_plugins:');
  if (projectPlugins.length === 0) {
    lines[lines.length - 1] += ' []';
  } else {
    projectPlugins.forEach(id => lines.push(`  - ${id}`));
  }
  lines.push('');
  return lines.join('\n');
}

async function loadPluginRegistry() {
  const registryPath = path.join(__dirname, '..', 'lib', 'plugins', 'registry.json');
  try {
    const registry = await fs.readJson(registryPath);
    const plugins = Array.isArray(registry.plugins) ? registry.plugins : [];
    return { ...registry, plugins };
  } catch (e) {
    return { version: 1, plugins: [] };
  }
}

function getCorePluginIds(registry) {
  const plugins = Array.isArray(registry.plugins) ? registry.plugins : [];
  const core = plugins
    .filter(p => p && typeof p.id === 'string' && p.default_tier === 'core')
    .map(p => p.id);
  return core.length > 0 ? core : DEFAULT_CORE_PLUGINS;
}

function getProjectPlugins(registry) {
  const plugins = Array.isArray(registry.plugins) ? registry.plugins : [];
  return plugins
    .filter(p => p && typeof p.id === 'string' && p.default_tier !== 'core')
    .sort((a, b) => {
      const byCategory = String(a.category || '').localeCompare(String(b.category || ''));
      if (byCategory !== 0) return byCategory;
      return String(a.name || a.id).localeCompare(String(b.name || b.id));
    });
}

function buildProjectPluginItems(registry, t) {
  const projectPlugins = getProjectPlugins(registry);
  if (projectPlugins.length === 0) {
    return [{ id: 'plugin:none', type: 'label', label: t.noProjectPlugins }];
  }
  return projectPlugins.map(plugin => {
    const integrationType = plugin.integration && plugin.integration.type
      ? plugin.integration.type
      : 'unknown';
    const category = plugin.category || 'other';
    const name = plugin.name || plugin.id;
    const label = `${name} (${category}, ${integrationType})`;
    return { id: `plugin:${plugin.id}`, type: 'checkbox', label };
  });
}

function ensureScroll(state, itemsLength) {
  const maxVisible = state.step === 'plugins' ? MAX_VISIBLE_ITEMS : itemsLength;
  if (itemsLength <= maxVisible) {
    state.scroll = 0;
    return;
  }

  const maxScroll = Math.max(0, itemsLength - maxVisible);
  if (state.focus < itemsLength) {
    if (state.focus < state.scroll) {
      state.scroll = state.focus;
    } else if (state.focus >= state.scroll + maxVisible) {
      state.scroll = state.focus - maxVisible + 1;
    }
  }
  state.scroll = clamp(state.scroll, 0, maxScroll);
}

function getStringWidth(str) {
  let width = 0;
  const stripped = str.replace(/\u001b\[\d+m/g, '');
  for (let i = 0; i < stripped.length; i++) {
    const code = stripped.charCodeAt(i);
    if (code > 255) width += 2;
    else width += 1;
  }
  return width;
}

function isTTY() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

function enterAltScreen() {
  process.stdout.write('\u001b[?1049h');
}

function exitAltScreen() {
  process.stdout.write('\u001b[?1049l');
}

function hideCursor() {
  process.stdout.write('\u001b[?25l');
}

function showCursor() {
  process.stdout.write('\u001b[?25h');
}

async function findExecutable(binary) {
  const envPath = process.env.PATH || '';
  const pathEntries = envPath.split(path.delimiter).filter(Boolean);
  const extensions = process.platform === 'win32'
    ? (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';')
    : [''];

  for (const entry of pathEntries) {
    for (const ext of extensions) {
      const candidate = path.join(entry, `${binary}${ext}`);
      try {
        await fs.access(candidate, fs.constants.X_OK);
        return candidate;
      } catch (e) {
        // ignore
      }
    }
  }
  return null;
}

// Visual Helpers
const BOX_CHARS = {
  tl: '┌', h: '─', tr: '┐',
  v: '│',
  bl: '└', br: '┘',
  dl: '═', dtl: '╔', dtr: '╗', dbl: '╚', dbr: '╝'
};

function drawDoubleBox(lines, borderColor = chalk.cyan) {
  const width = 60;
  const output = [];
  output.push(borderColor(BOX_CHARS.dtl + BOX_CHARS.dl.repeat(width - 2) + BOX_CHARS.dtr));
  lines.forEach(line => {
    const visibleLen = getStringWidth(line);
    const padding = Math.max(0, width - 4 - visibleLen);
    let content;
    if (visibleLen < width - 4) {
      const leftSpace = Math.floor(padding / 2);
      const rightSpace = padding - leftSpace;
      content = ' '.repeat(leftSpace) + line + ' '.repeat(rightSpace);
    } else {
      content = line.substring(0, width - 4);
    }
    output.push(borderColor(BOX_CHARS.v) + ' ' + content + ' ' + borderColor(BOX_CHARS.v));
  });
  output.push(borderColor(BOX_CHARS.dbl + BOX_CHARS.dl.repeat(width - 2) + BOX_CHARS.dbr));
  return output;
}

function drawSingleBox(lines, borderColor = chalk.cyan) {
  const width = 60;
  const output = [];
  output.push(borderColor(BOX_CHARS.tl + BOX_CHARS.h.repeat(width - 2) + BOX_CHARS.tr));
  lines.forEach(line => {
    const visibleLen = getStringWidth(line);
    const padding = Math.max(0, width - 2 - visibleLen);
    const leftSpace = Math.floor(padding / 2);
    const rightSpace = padding - leftSpace;
    output.push(borderColor(BOX_CHARS.v) + ' '.repeat(leftSpace) + line + ' '.repeat(rightSpace) + borderColor(BOX_CHARS.v));
  });
  output.push(borderColor(BOX_CHARS.bl + BOX_CHARS.h.repeat(width - 2) + BOX_CHARS.br));
  return output;
}

function formatCheckbox(checked) {
  return checked ? chalk.green('◉') : chalk.gray('○');
}

function formatRadio(selected) {
  return selected ? chalk.green('●') : chalk.gray('○');
}

function getAdapterValue(state) {
  if (state.adapters.claude && state.adapters.opencode) return 'both';
  if (state.adapters.opencode) return 'opencode';
  return 'claude';
}

function computeWillCopy(state, env) {
  const willCopyClaude = state.adapters.claude && (state.force || !env.hasClaude);
  const willCopyOpencode = state.adapters.opencode && (state.force || !env.hasOpencode);
  return { willCopyClaude, willCopyOpencode };
}

function collectWarnings(state, env, t) {
  const warnings = [];
  if (state.adapters.claude && !env.hasClaudeCLI) {
    warnings.push(t.warnClaudeCLI);
  }
  if (state.adapters.opencode && !env.hasOpenCodeCLI) {
    warnings.push(t.warnOpenCodeCLI);
  }
  return warnings;
}

function validateAdapterStep(state, t) {
  if (!state.adapters.claude && !state.adapters.opencode) {
    return t.errSelectAdapter;
  }
  return null;
}

function validateFinal(state, env, t) {
  const errors = [];
  const adErr = validateAdapterStep(state, t);
  if (adErr) errors.push(adErr);

  const { willCopyClaude, willCopyOpencode } = computeWillCopy(state, env);
  if (!willCopyClaude && !willCopyOpencode) {
    if (state.adapters.claude && env.hasClaude && !state.force) {
      errors.push(t.errClaudeExists);
    }
    if (state.adapters.opencode && env.hasOpencode && !state.force) {
      errors.push(t.errOpencodeExists);
    }
  }
  return errors;
}

// --- Wizard Configuration ---

function getStepConfig(t, pluginItems) {
  return {
    adapter: {
      title: t.stepAdapter,
      items: [
        { id: 'adapter:claude', type: 'checkbox', label: t.claudeAdapter },
        { id: 'adapter:opencode', type: 'checkbox', label: t.opencodeAdapter },
      ],
      actions: ['exit', 'next']
    },
    mode: {
      title: t.stepMode,
      items: [
        { id: 'mode:full', type: 'radio', value: 'full', label: t.fullMode },
        { id: 'mode:minimal', type: 'radio', value: 'minimal', label: t.minimalMode },
      ],
      actions: ['exit', 'back', 'next']
    },
    plugins: {
      title: t.stepPlugins,
      items: pluginItems,
      actions: ['exit', 'back', 'next']
    },
    advanced: {
      title: t.stepAdvanced,
      items: [
        { id: 'force', type: 'checkbox', label: t.forceOverwrite },
      ],
      actions: ['exit', 'back', 'preview']
    }
  };
}

function renderHeader(env, t, contextTitle) {
  const lines = [];
  const bannerLines = [...TITLE_BANNER];

  bannerLines.push("");
  bannerLines.push(chalk.bold(t.subtitle));
  bannerLines.push(chalk.cyan(t.website));

  lines.push(...drawDoubleBox(bannerLines));
  lines.push("");

  const title = contextTitle ? `${t.setupWizard} > ${contextTitle}` : t.setupWizard;
  lines.push(...drawSingleBox([chalk.bold(title)]));
  lines.push("");

  return lines;
}

function renderStep(state, env) {
  const t = I18N[state.lang];
  const pluginItems = buildProjectPluginItems(env.pluginRegistry, t);
  const config = getStepConfig(t, pluginItems)[state.step];
  const items = config.items;
  const actions = config.actions;

  const lines = renderHeader(env, t, config.title);

  // Status Info
  lines.push(`  ${t.project}: ${chalk.white(path.basename(env.cwd))}`);
  const statusParts = [];
  if (env.hasClaude) statusParts.push(chalk.green("Claude"));
  else statusParts.push(chalk.gray("No-Claude"));
  if (env.hasOpencode) statusParts.push(chalk.green("OpenCode"));
  else statusParts.push(chalk.gray("No-OpenCode"));
  lines.push(`  ${t.detect} : ${statusParts.join(chalk.gray(" | "))}`);

  const cliParts = [];
  if (env.hasClaudeCLI) cliParts.push(chalk.green("Claude"));
  else cliParts.push(chalk.gray("No-Claude"));
  if (env.hasOpenCodeCLI) cliParts.push(chalk.green("OpenCode"));
  else cliParts.push(chalk.gray("No-OpenCode"));
  lines.push(`  ${t.cli}   : ${cliParts.join(chalk.gray(" | "))}`);
  lines.push("");

  // Instructions
  lines.push(`  ${chalk.yellow("💡")} ${chalk.gray(t.instructions)}`);
  if (state.step === 'plugins') {
    lines.push(chalk.gray("  " + t.hintPluginsPlanned));
    if (env.pluginsConfigExists && !state.force) {
      lines.push(chalk.gray("  " + t.hintPluginsExistingConfig));
    }
  }
  lines.push("");

  // Render Items
  const maxVisible = state.step === 'plugins' ? MAX_VISIBLE_ITEMS : items.length;
  const scrollStart = items.length > maxVisible
    ? clamp(state.scroll || 0, 0, Math.max(0, items.length - maxVisible))
    : 0;
  const scrollEnd = items.length > maxVisible
    ? Math.min(items.length, scrollStart + maxVisible)
    : items.length;

  if (scrollStart > 0) {
    lines.push(chalk.gray("  …"));
  }

  items.slice(scrollStart, scrollEnd).forEach((item, offset) => {
    const index = scrollStart + offset;
    const isFocused = state.focus === index;
    const prefix = isFocused ? chalk.bold.cyan("❯") : " ";

    let indicator = "";
    let text = item.label;

    if (item.type === 'checkbox') {
      let val = false;
      if (item.id.startsWith('adapter:')) {
        val = state.adapters[item.id.split(':')[1]];
      } else if (item.id === 'force') {
        val = state.force;
      } else if (item.id.startsWith('plugin:') && state.projectPlugins) {
        const pluginId = item.id.split(':').slice(1).join(':');
        val = state.projectPlugins.has(pluginId);
      }
      indicator = formatCheckbox(val) + " ";
    } else if (item.type === 'radio') {
      const val = state.mode === (item.value || 'full');
      indicator = formatRadio(val) + " ";
    }

    let styledText = isFocused ? chalk.bold.cyan(text) : chalk.white(text);
    if (item.type === 'label') {
      styledText = chalk.gray(text);
    }
    lines.push(`  ${prefix} ${indicator}${styledText}`);
  });

  if (scrollEnd < items.length) {
    lines.push(chalk.gray("  …"));
  }

  lines.push("");
  lines.push(chalk.gray("  ──────────────────"));

  // Render Bottom Actions (Next/Back)
  // We represent them as items after the main list
  // Focus index continues after main items: itemLen, itemLen+1...

  const actionLine = actions.map((act, i) => {
    const actIndex = items.length + i;
    const label = act === 'next' ? t.next : (act === 'back' ? t.back : (act === 'preview' ? t.preview : t.exit));
    const isFocused = state.focus === actIndex;
    const prefix = isFocused ? chalk.bold.cyan("❯") : " ";
    const text = isFocused ? chalk.bold.cyan(label) : chalk.white(label);
    return `${prefix} ${text}`;
  }).join("   ");

  lines.push("  " + actionLine);

  return lines;
}

function renderPreview(state, env, focus) {
  const t = I18N[state.lang];
  const lines = renderHeader(env, t, t.previewChanges);

  const { willCopyClaude, willCopyOpencode } = computeWillCopy(state, env);
  const errors = validateFinal(state, env, t);
  const warnings = collectWarnings(state, env, t);
  const selectedPlugins = state.projectPlugins ? [...state.projectPlugins].sort() : [];

  lines.push(`  ${chalk.bold(t.directoriesToCreate)}`);

  if (willCopyClaude) lines.push(chalk.green("  + .claude/"));
  if (willCopyOpencode) lines.push(chalk.green("  + .opencode/"));

  if (state.mode === 'full') {
    lines.push(chalk.green("  + docs/core/"));
    lines.push(chalk.green("  + docs/project/"));
  } else {
    lines.push(chalk.green("  + docs/core/"));
  }
  const pluginsSelectionChanged =
    env.pluginsConfigExists &&
    !state.force &&
    state.initialProjectPlugins &&
    !areSetsEqual(state.projectPlugins, state.initialProjectPlugins);
  if (pluginsSelectionChanged) {
    lines.push(chalk.yellow("  ~ docs/.jvibe/plugins.yaml"));
  } else {
    lines.push(chalk.green("  + docs/.jvibe/plugins.yaml"));
  }

  if (!willCopyClaude && !willCopyOpencode && !state.force) {
    if (!willCopyClaude && !willCopyOpencode) {
      lines.push(chalk.gray(t.noChanges));
    }
  }

  lines.push("");

  lines.push(chalk.bold(`  ${t.pluginsSummary}`));
  if (selectedPlugins.length === 0) {
    lines.push(chalk.gray(t.pluginsNone));
  } else {
    lines.push(chalk.gray(`  ${selectedPlugins.join(', ')}`));
  }
  lines.push("");

  if (errors.length > 0) {
    lines.push(chalk.bold.red(`  ${t.validationIssues}`));
    errors.forEach(e => lines.push(chalk.red(`  • ${e}`)));
    lines.push("");
  }

  if (warnings.length > 0) {
    lines.push(chalk.bold.yellow(`  ${t.warnings}`));
    warnings.forEach(w => lines.push(chalk.yellow(`  • ${w}`)));
  } else {
    lines.push(chalk.green(`  ✔ ${t.readyToInit}`));
  }

  lines.push("");
  lines.push(chalk.gray("  ──────────────────"));

  const renderAction = (index, label) => {
    const isFocused = focus === index;
    const prefix = isFocused ? chalk.bold.cyan("❯") : " ";
    const text = isFocused ? chalk.bold.cyan(label) : chalk.white(label);
    return `  ${prefix} ${text}`;
  };

  lines.push(renderAction(0, t.back));
  lines.push(renderAction(1, t.confirmApply));

  return lines;
}

function renderMessage(message, state) {
  const t = I18N[state.lang];
  const lines = [];
  lines.push("");
  message.forEach(line => lines.push(chalk.red("  " + line)));
  lines.push("");
  lines.push(chalk.gray("  " + t.pressEnter));
  return drawDoubleBox(lines, chalk.red);
}

function renderLanguage(state) {
  const lines = [];
  const bannerLines = [...TITLE_BANNER];
  lines.push(...drawDoubleBox(bannerLines));
  lines.push("");

  const prompt = "Please Select Language / 请选择语言";
  const width = 60 - 4;
  const pad = Math.max(0, Math.floor((width - getStringWidth(prompt)) / 2));
  lines.push(' '.repeat(pad) + chalk.bold(prompt));
  lines.push("");

  const selected = state.focus;
  const renderOption = (index, label) => {
    const isFocused = selected === index;
    const prefix = isFocused ? chalk.bold.cyan("❯") : " ";
    const text = isFocused ? chalk.bold.cyan(label) : chalk.white(label);
    return `      ${prefix} ${text}`;
  };

  lines.push(renderOption(0, "English"));
  lines.push(renderOption(1, "中文 (Chinese)"));
  lines.push("");
  return lines;
}

async function setup() {
  if (!isTTY()) {
    console.error('TUI requires a TTY. Use `jvibe init --no-ui` to skip the UI.');
    process.exit(1);
  }

  const env = {
    cwd: process.cwd()
  };
  env.hasClaude = await fs.pathExists(path.join(env.cwd, '.claude'));
  env.hasOpencode = await fs.pathExists(path.join(env.cwd, '.opencode'));
  env.initialized = await fs.pathExists(path.join(env.cwd, 'docs/core'));
  env.hasClaudeCLI = Boolean(await findExecutable('claude'));
  env.hasOpenCodeCLI = Boolean(await findExecutable('opencode'));
  env.pluginRegistry = await loadPluginRegistry();
  env.pluginsConfigPath = path.join(env.cwd, 'docs', '.jvibe', 'plugins.yaml');
  env.pluginsConfigExists = await fs.pathExists(env.pluginsConfigPath);

  const state = {
    step: 'language', // language -> adapter -> mode -> plugins -> advanced -> preview
    lang: 'en',
    focus: 0,
    adapters: {
      claude: false,
      opencode: false
    },
    mode: 'full',
    force: false,
    projectPlugins: new Set(),
    initialProjectPlugins: new Set(),
    scroll: 0,
    previewFocus: 0,
    message: null,
    returnStep: null
  };

  if (env.pluginsConfigExists) {
    try {
      const raw = await fs.readFile(env.pluginsConfigPath, 'utf-8');
      const parsed = parsePluginListsFromYaml(raw);
      const existing = Array.isArray(parsed.project_plugins) ? parsed.project_plugins : [];
      existing.forEach(id => state.projectPlugins.add(id));
    } catch (e) {
      // ignore
    }
  }
  state.initialProjectPlugins = new Set(state.projectPlugins);

  function render() {
    process.stdout.write('\u001b[2J\u001b[H\u001b[3J');
    let lines = [];
    if (state.step === 'language') {
      lines = renderLanguage(state);
    } else if (['adapter', 'mode', 'plugins', 'advanced'].includes(state.step)) {
      lines = renderStep(state, env);
    } else if (state.step === 'preview') {
      lines = renderPreview(state, env, state.previewFocus);
    } else if (state.step === 'message') {
      lines = renderMessage(state.message || [], state);
    }
    process.stdout.write(lines.join('\n'));
  }

  function cleanup() {
    exitAltScreen();
    showCursor();
    process.stdin.setRawMode(false);
    process.stdin.pause();
    process.stdin.removeAllListeners('data');
  }

  async function applySelection() {
    const t = I18N[state.lang];
    const errors = validateFinal(state, env, t);
    if (errors.length > 0) {
      state.step = 'message';
      state.message = errors;
      render();
      return;
    }

    const pluginsPath = path.join(env.cwd, 'docs', '.jvibe', 'plugins.yaml');
    const pluginsExistedBefore = await fs.pathExists(pluginsPath);
    const pluginsSelectionChanged =
      pluginsExistedBefore &&
      !state.force &&
      state.initialProjectPlugins &&
      !areSetsEqual(state.projectPlugins, state.initialProjectPlugins);

    cleanup();
    console.log('');
    await init({
      mode: state.mode,
      force: state.force,
      adapter: getAdapterValue(state)
    });

    const corePlugins = getCorePluginIds(env.pluginRegistry);
    const projectPlugins = [...state.projectPlugins].sort();

    if (state.force || !pluginsExistedBefore) {
      await fs.ensureDir(path.dirname(pluginsPath));
      await fs.writeFile(pluginsPath, formatPluginsYaml(corePlugins, projectPlugins), 'utf-8');
    } else if (pluginsSelectionChanged) {
      try {
        const raw = await fs.readFile(pluginsPath, 'utf-8');
        const updated = updateYamlListInContent(raw, 'project_plugins', projectPlugins);
        await fs.writeFile(pluginsPath, updated, 'utf-8');
      } catch (e) {
        await fs.ensureDir(path.dirname(pluginsPath));
        await fs.writeFile(pluginsPath, formatPluginsYaml(corePlugins, projectPlugins), 'utf-8');
      }
    }

    if (state.adapters.claude) {
      try {
        const result = await configureClaudeCoreTools(env.cwd, env.pluginRegistry);
        if (result && result.error) {
          console.log(chalk.yellow(`⚠️  Core Tools 自动配置已跳过：${result.error}`));
        }
        // MCP Server 配置结果
        const mcpAdded = typeof result.mcpAdded === 'number'
          ? result.mcpAdded
          : result.added - (result.skillsAdded ? result.skillsAdded.length : 0);
        if (mcpAdded > 0) {
          console.log(chalk.gray(`   已写入 MCP Server 配置: ${mcpAdded} 项 (.claude/settings.local.json)`));
        }
        // Skill 配置结果
        if (result && Array.isArray(result.skillsAdded) && result.skillsAdded.length > 0) {
          console.log(chalk.gray(`   已安装 Skill: ${result.skillsAdded.length} 项`));
          result.skillsAdded.forEach(({ pluginId }) => {
            if (pluginId) console.log(chalk.gray(`   - ${pluginId}`));
          });
        }
        if (result && Array.isArray(result.skillsNeedingCli) && result.skillsNeedingCli.length > 0) {
          result.skillsNeedingCli.forEach(({ pluginId, globalInstall }) => {
            if (!pluginId || !globalInstall) return;
            console.log(chalk.yellow(`   ⚠️  ${pluginId} 需要全局安装 CLI: ${globalInstall}`));
          });
        }
        if (result && Array.isArray(result.missingTemplates) && result.missingTemplates.length > 0) {
          console.log(chalk.yellow(`⚠️  以下 Core Tools 未提供自动配置模板，请手动配置: ${result.missingTemplates.join(', ')}`));
        }
        if (result && Array.isArray(result.missingEnv) && result.missingEnv.length > 0) {
          console.log(chalk.yellow('⚠️  以下 Core Tools 可能缺少环境变量，启动 MCP Server 时可能失败：'));
          result.missingEnv.forEach(({ pluginId, keys }) => {
            if (!pluginId || !Array.isArray(keys) || keys.length === 0) return;
            console.log(chalk.yellow(`   - ${pluginId}: ${keys.join(', ')}`));
          });
        }
      } catch (e) {
        // fail-open
      }
    }
    process.exit(0);
  }

  enterAltScreen();
  hideCursor();
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.on('exit', () => showCursor());

  render();

  process.stdin.on('data', async (key) => {
    if (key === KEY.CTRL_C) {
      cleanup();
      process.exit(0);
    }

    if (state.step === 'language') {
      if (key === KEY.UP || key === KEY.DOWN) {
        state.focus = state.focus === 0 ? 1 : 0;
        render();
      } else if (key === KEY.ENTER) {
        state.lang = state.focus === 0 ? 'en' : 'zh';
        state.step = 'adapter';
        state.focus = 0;
        render();
      }
      return;
    }

    if (state.step === 'message') {
      if (key === KEY.ENTER) {
        state.step = state.returnStep || 'preview';
        state.returnStep = null;
        state.message = null;
        render();
      }
      return;
    }

    if (state.step === 'preview') {
      if (key === KEY.ESC) {
        state.step = 'advanced';
        state.focus = 0; // Reset focus to item
        state.scroll = 0;
        render();
        return;
      }
      if (key === KEY.LEFT || key === KEY.UP) { state.previewFocus = 0; render(); }
      if (key === KEY.RIGHT || key === KEY.DOWN) { state.previewFocus = 1; render(); }
      if (key === KEY.ENTER) {
        if (state.previewFocus === 0) {
          state.step = 'advanced';
          state.scroll = 0;
          render();
        } else {
          await applySelection();
        }
      }
      return;
    }

    // Step Logic
    const t = I18N[state.lang];
    const pluginItems = buildProjectPluginItems(env.pluginRegistry, t);
    const config = getStepConfig(t, pluginItems)[state.step];
    const items = config.items;
    const actions = config.actions;
    const totalLen = items.length + actions.length;

    if (key === KEY.ESC) {
      if (state.step === 'adapter') {
        state.step = 'language';
        state.focus = 0;
      } else if (state.step === 'mode') {
        state.step = 'adapter';
        state.focus = 0;
      } else if (state.step === 'plugins') {
        state.step = 'mode';
        state.focus = 0;
      } else if (state.step === 'advanced') {
        state.step = 'plugins';
        state.focus = 0;
      }
      state.scroll = 0;
      render();
      return;
    }

    if (key === KEY.UP) {
      if (totalLen === 0) {
        return;
      }
      let next = state.focus - 1;
      if (next < 0) next = totalLen - 1;
      state.focus = next;
      ensureScroll(state, items.length);
      render();
      return;
    }

    if (key === KEY.DOWN) {
      // If in items, loop items. If at bottom item, go to first action? 
      // Let's keep items and actions separated by UP/DOWN vs interaction
      // Or make it one list. One list is simpler.
      let next = state.focus + 1;
      if (next >= totalLen) next = 0; // Loop back to top
      state.focus = next;
      ensureScroll(state, items.length);
      render();
      return;
    }

    // Left/Right: Switch focus between actions if focus is in action area
    if (key === KEY.LEFT || key === KEY.RIGHT) {
      if (state.focus >= items.length) {
        // We are in action area
        const actionIndex = state.focus - items.length;
        const delta = key === KEY.LEFT ? -1 : 1;
        let nextAction = actionIndex + delta;

        if (nextAction >= 0 && nextAction < actions.length) {
          state.focus = items.length + nextAction;
        }
      }
      render();
      return;
    }

    if (key === KEY.ENTER) {
      const isItem = state.focus < items.length;

      if (isItem) {
        // Toggle Logic
        const item = items[state.focus];
        if (item.type === 'checkbox') {
          if (item.id.startsWith('adapter:')) {
            const key = item.id.split(':')[1];
            state.adapters[key] = !state.adapters[key];
          } else if (item.id === 'force') {
            state.force = !state.force;
          } else if (item.id.startsWith('plugin:')) {
            const pluginId = item.id.split(':').slice(1).join(':');
            if (state.projectPlugins.has(pluginId)) {
              state.projectPlugins.delete(pluginId);
            } else {
              state.projectPlugins.add(pluginId);
            }
          }
        }
        else if (item.type === 'radio') {
          state.mode = item.value;
        }
      } else {
        // Action Logic
        const actionIdx = state.focus - items.length;
        const action = actions[actionIdx];

        if (action === 'exit') {
          cleanup();
          process.exit(0);
        } else if (action === 'next') {
          if (state.step === 'adapter') {
            const err = validateAdapterStep(state, t);
            if (err) {
              state.step = 'message';
              state.message = [err];
              state.returnStep = 'adapter';
            } else {
              state.step = 'mode';
              state.focus = 0;
              state.scroll = 0;
            }
          } else if (state.step === 'mode') {
            state.step = 'plugins';
            state.focus = 0;
            state.scroll = 0;
          } else if (state.step === 'plugins') {
            state.step = 'advanced';
            state.focus = 0;
            state.scroll = 0;
          }
        }
        else if (action === 'back') {
          if (state.step === 'mode') {
            state.step = 'adapter';
            state.focus = 0;
            state.scroll = 0;
          } else if (state.step === 'plugins') {
            state.step = 'mode';
            state.focus = 0;
            state.scroll = 0;
          } else if (state.step === 'advanced') {
            state.step = 'plugins';
            state.focus = 0;
            state.scroll = 0;
          }
        }
        else if (action === 'preview') {
          state.step = 'preview';
          state.previewFocus = 0;
        }
      }
      render();
    }

  });
}

module.exports = setup;
