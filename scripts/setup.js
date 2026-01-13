/**
 * JVibe TUI Setup
 * 终端交互式配置入口（方向键 + Enter）
 */

const fs = require('fs-extra');
const path = require('path');
const init = require('./init');

const KEY = {
  UP: '\u001b[A',
  DOWN: '\u001b[B',
  LEFT: '\u001b[D',
  RIGHT: '\u001b[C',
  ENTER: '\r',
  ESC: '\u001b',
  CTRL_C: '\u0003'
};

function isTTY() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

function clearScreen() {
  process.stdout.write('\u001b[2J\u001b[H');
}

function hideCursor() {
  process.stdout.write('\u001b[?25l');
}

function showCursor() {
  process.stdout.write('\u001b[?25h');
}

function formatCheckbox(checked) {
  return checked ? '[x]' : '[ ]';
}

function formatRadio(selected) {
  return selected ? '(*)' : '( )';
}

function formatAction(label, focused) {
  return focused ? `[>${label}<]` : `[ ${label} ]`;
}

function getAdapterValue(state) {
  if (state.adapters.claude && state.adapters.opencode) return 'both';
  if (state.adapters.opencode) return 'opencode';
  return 'claude';
}

function buildMainItems() {
  return [
    { id: 'adapter:claude', type: 'checkbox' },
    { id: 'adapter:opencode', type: 'checkbox' },
    { id: 'mode:full', type: 'radio' },
    { id: 'mode:minimal', type: 'radio' },
    { id: 'force', type: 'checkbox' },
    { id: 'action:preview', type: 'action' },
    { id: 'action:apply', type: 'action' },
    { id: 'action:exit', type: 'action' }
  ];
}

function buildPreviewItems() {
  return [
    { id: 'action:back', type: 'action' },
    { id: 'action:apply', type: 'action' }
  ];
}

function computeWillCopy(state, env) {
  const willCopyClaude = state.adapters.claude && (state.force || !env.hasClaude);
  const willCopyOpencode = state.adapters.opencode && (state.force || !env.hasOpencode);
  return { willCopyClaude, willCopyOpencode };
}

function validateSelection(state, env) {
  const errors = [];
  if (!state.adapters.claude && !state.adapters.opencode) {
    errors.push('Select at least one adapter.');
  }

  const { willCopyClaude, willCopyOpencode } = computeWillCopy(state, env);
  if (!willCopyClaude && !willCopyOpencode) {
    if (state.adapters.claude && env.hasClaude && !state.force) {
      errors.push('Claude config exists. Enable force or deselect Claude.');
    }
    if (state.adapters.opencode && env.hasOpencode && !state.force) {
      errors.push('OpenCode config exists. Enable force or deselect OpenCode.');
    }
  }

  return errors;
}

function renderMain(state, env, items) {
  const lines = [];
  lines.push('JVibe Setup');
  lines.push('-----------------------------------------------');
  lines.push(`Project: ${env.cwd}`);
  lines.push(`Detected: .claude=${env.hasClaude ? 'YES' : 'NO'}  .opencode=${env.hasOpencode ? 'YES' : 'NO'}`);
  lines.push(`Status : ${env.initialized ? 'Initialized' : 'Not initialized'}`);
  lines.push('-----------------------------------------------');
  lines.push('Adapters');
  lines.push(`${state.focus === 0 ? '>' : ' '} Claude Code      ${formatCheckbox(state.adapters.claude)}`);
  lines.push(`${state.focus === 1 ? '>' : ' '} OpenCode         ${formatCheckbox(state.adapters.opencode)}`);
  lines.push('');
  lines.push('Init Mode');
  lines.push(`${state.focus === 2 ? '>' : ' '} Full            ${formatRadio(state.mode === 'full')}`);
  lines.push(`${state.focus === 3 ? '>' : ' '} Minimal         ${formatRadio(state.mode === 'minimal')}`);
  lines.push('');
  lines.push('Overwrite');
  lines.push(`${state.focus === 4 ? '>' : ' '} Force overwrite existing configs ${formatCheckbox(state.force)}`);
  lines.push('');
  lines.push('Actions');
  const actionFocus = state.focus >= 5 ? state.focus - 5 : -1;
  const actionLabels = ['Preview', 'Apply', 'Exit'];
  const actionLine = actionLabels
    .map((label, index) => formatAction(label, actionFocus === index))
    .join('   ');
  lines.push(`  ${actionLine}`);
  lines.push('');
  lines.push('Use arrow keys to move. Enter to select. Esc to exit.');
  return lines;
}

function renderPreview(state, env, focus) {
  const lines = [];
  const { willCopyClaude, willCopyOpencode } = computeWillCopy(state, env);
  const errors = validateSelection(state, env);

  lines.push('Preview Changes');
  lines.push('-----------------------------------------------');
  lines.push('Will write:');
  if (willCopyClaude) {
    lines.push('  - .claude/ (agents, commands, hooks)');
  }
  if (willCopyOpencode) {
    lines.push('  - .opencode/ (agent, command, configs)');
  }
  lines.push(`  - docs/core/ (${state.mode === 'full' ? 'core + project' : 'core only'})`);
  if (state.mode === 'full') {
    lines.push('  - docs/project/ (full mode only)');
  }

  const conflicts = [];
  if (state.adapters.claude && env.hasClaude && !state.force) {
    conflicts.push('.claude exists (force required)');
  }
  if (state.adapters.opencode && env.hasOpencode && !state.force) {
    conflicts.push('.opencode exists (force required)');
  }

  lines.push('');
  lines.push('Conflicts:');
  if (conflicts.length === 0) {
    lines.push('  - none');
  } else {
    conflicts.forEach(item => lines.push(`  - ${item}`));
  }

  if (errors.length > 0) {
    lines.push('');
    lines.push('Blocked:');
    errors.forEach(item => lines.push(`  - ${item}`));
  }

  lines.push('');
  const actions = ['Back', 'Apply'];
  const actionLine = actions
    .map((label, index) => formatAction(label, focus === index))
    .join('   ');
  lines.push(`  ${actionLine}`);
  lines.push('');
  lines.push('Use arrow keys to move. Enter to select. Esc to exit.');
  return lines;
}

function renderMessage(message) {
  const lines = [];
  lines.push('Message');
  lines.push('-----------------------------------------------');
  message.forEach(line => lines.push(line));
  lines.push('');
  lines.push('[ Press Enter to return ]');
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

  const state = {
    screen: 'main',
    focus: 0,
    adapters: {
      claude: env.hasClaude || (!env.hasOpencode && !env.hasClaude),
      opencode: env.hasOpencode && !env.hasClaude
    },
    mode: 'full',
    force: false,
    previewFocus: 0,
    message: null
  };

  const mainItems = buildMainItems();
  const previewItems = buildPreviewItems();

  function render() {
    clearScreen();
    if (state.screen === 'main') {
      const lines = renderMain(state, env, mainItems);
      process.stdout.write(lines.join('\n'));
    } else if (state.screen === 'preview') {
      const lines = renderPreview(state, env, state.previewFocus);
      process.stdout.write(lines.join('\n'));
    } else if (state.screen === 'message') {
      const lines = renderMessage(state.message || []);
      process.stdout.write(lines.join('\n'));
    }
  }

  function cleanup() {
    showCursor();
    process.stdin.setRawMode(false);
    process.stdin.pause();
    process.stdin.removeAllListeners('data');
  }

  function moveFocus(delta, max) {
    const next = state.focus + delta;
    if (next < 0) {
      state.focus = max - 1;
    } else if (next >= max) {
      state.focus = 0;
    } else {
      state.focus = next;
    }
  }

  function toggleCurrent() {
    const current = mainItems[state.focus];
    if (!current) return;
    if (current.id === 'adapter:claude') state.adapters.claude = !state.adapters.claude;
    if (current.id === 'adapter:opencode') state.adapters.opencode = !state.adapters.opencode;
    if (current.id === 'mode:full') state.mode = 'full';
    if (current.id === 'mode:minimal') state.mode = 'minimal';
    if (current.id === 'force') state.force = !state.force;
  }

  async function applySelection() {
    const errors = validateSelection(state, env);
    if (errors.length > 0) {
      state.screen = 'message';
      state.message = errors;
      render();
      return;
    }

    cleanup();
    await init({
      mode: state.mode,
      force: state.force,
      adapter: getAdapterValue(state)
    });
    process.exit(0);
  }

  hideCursor();
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  render();

  process.stdin.on('data', async (key) => {
    if (key === KEY.CTRL_C || key === KEY.ESC) {
      cleanup();
      process.exit(0);
    }

    if (state.screen === 'message') {
      if (key === KEY.ENTER) {
        state.screen = 'main';
        state.message = null;
        render();
      }
      return;
    }

    if (state.screen === 'preview') {
      if (key === KEY.LEFT) {
        state.previewFocus = state.previewFocus === 0 ? 1 : 0;
        render();
        return;
      }
      if (key === KEY.RIGHT) {
        state.previewFocus = state.previewFocus === 1 ? 0 : 1;
        render();
        return;
      }
      if (key === KEY.UP || key === KEY.DOWN) {
        state.previewFocus = state.previewFocus === 0 ? 1 : 0;
        render();
        return;
      }
      if (key === KEY.ENTER) {
        if (state.previewFocus === 0) {
          state.screen = 'main';
          render();
        } else {
          await applySelection();
        }
      }
      return;
    }

    if (key === KEY.UP) {
      moveFocus(-1, mainItems.length);
      render();
      return;
    }
    if (key === KEY.DOWN) {
      moveFocus(1, mainItems.length);
      render();
      return;
    }

    if (key === KEY.LEFT || key === KEY.RIGHT) {
      const current = mainItems[state.focus];
      if (current.type === 'action') {
        const direction = key === KEY.LEFT ? -1 : 1;
        const actionFocus = state.focus - 5;
        const nextAction = actionFocus + direction;
        if (nextAction >= 0 && nextAction <= 2) {
          state.focus = 5 + nextAction;
        }
      } else {
        toggleCurrent();
      }
      render();
      return;
    }

    if (key === KEY.ENTER) {
      const current = mainItems[state.focus];
      if (!current) return;
      if (current.type === 'action') {
        if (current.id === 'action:preview') {
          state.screen = 'preview';
          state.previewFocus = 0;
        } else if (current.id === 'action:apply') {
          await applySelection();
          return;
        } else if (current.id === 'action:exit') {
          cleanup();
          process.exit(0);
        }
      } else {
        toggleCurrent();
      }
      render();
    }
  });
}

module.exports = setup;
