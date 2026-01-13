/**
 * JVibe Init Script
 * 初始化项目的 JVibe 配置
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const TEMPLATE_DIR = path.join(__dirname, '../template');

/**
 * 初始化 JVibe 项目
 * @param {Object} options - 初始化选项
 * @param {string} options.mode - 模式: 'full' 或 'minimal'
 * @param {string} options.adapter - 适配环境: 'claude' | 'opencode' | 'both'
 * @param {boolean} options.force - 是否强制覆盖
 */
async function init(options = {}) {
  const mode = options.mode || 'full';
  const force = options.force || false;
  const adapter = (options.adapter || 'claude').toLowerCase();
  const normalizedAdapter = ['claude', 'opencode', 'both'].includes(adapter)
    ? adapter
    : 'claude';
  const useClaude = normalizedAdapter === 'claude' || normalizedAdapter === 'both';
  const useOpencode = normalizedAdapter === 'opencode' || normalizedAdapter === 'both';
  const cwd = process.cwd();

  console.log(chalk.blue('\n🚀 正在初始化 JVibe...\n'));

  try {
    // 1. 检查是否已存在 JVibe 配置
    const claudeDir = path.join(cwd, '.claude');
    const opencodeDir = path.join(cwd, '.opencode');
    const claudeExists = await fs.pathExists(claudeDir);
    const opencodeExists = await fs.pathExists(opencodeDir);
    const shouldCopyClaude = useClaude && (force || !claudeExists);
    const shouldCopyOpencode = useOpencode && (force || !opencodeExists);

    if (!force) {
      if (useClaude && claudeExists) {
        console.log(chalk.yellow('⚠️  检测到已存在 .claude/ 目录'));
        console.log(chalk.yellow('   使用 --force 选项强制覆盖'));
      }
      if (useOpencode && opencodeExists) {
        console.log(chalk.yellow('⚠️  检测到已存在 .opencode/ 目录'));
        console.log(chalk.yellow('   使用 --force 选项强制覆盖'));
      }
      if (!shouldCopyClaude && !shouldCopyOpencode) {
        return;
      }
    }

    // 2. 复制 .claude/ 目录
    if (shouldCopyClaude) {
      console.log(chalk.gray('   复制 .claude/ 配置...'));
      await fs.copy(
        path.join(TEMPLATE_DIR, '.claude'),
        claudeDir,
        { overwrite: force }
      );
    }

    // 3. 复制 .opencode/ 目录
    if (shouldCopyOpencode) {
      console.log(chalk.gray('   复制 .opencode/ 配置...'));
      await fs.copy(
        path.join(TEMPLATE_DIR, '.opencode'),
        opencodeDir,
        { overwrite: force }
      );
    }

    // 4. 复制文档目录
    if (mode === 'full') {
      console.log(chalk.gray('   复制 docs/ 文档模板...'));
      await fs.copy(
        path.join(TEMPLATE_DIR, 'docs'),
        path.join(cwd, 'docs'),
        { overwrite: force }
      );
    } else {
      // minimal 模式只复制 core 文档
      console.log(chalk.gray('   复制 docs/core/ 核心文档...'));
      await fs.ensureDir(path.join(cwd, 'docs'));
      await fs.copy(
        path.join(TEMPLATE_DIR, 'docs/core'),
        path.join(cwd, 'docs/core'),
        { overwrite: force }
      );
      const handoffDir = path.join(TEMPLATE_DIR, 'docs/.jvibe');
      if (await fs.pathExists(handoffDir)) {
        await fs.copy(
          handoffDir,
          path.join(cwd, 'docs/.jvibe'),
          { overwrite: force }
        );
      }
    }

    // 5. 更新 .gitignore
    const gitignorePath = path.join(cwd, '.gitignore');
    const jvibeIgnore = '\n# JVibe\n.claude/settings.local.json\n';

    if (await fs.pathExists(gitignorePath)) {
      const content = await fs.readFile(gitignorePath, 'utf-8');
      if (!content.includes('.claude/settings.local.json')) {
        console.log(chalk.gray('   更新 .gitignore...'));
        await fs.appendFile(gitignorePath, jvibeIgnore);
      }
    } else {
      console.log(chalk.gray('   创建 .gitignore...'));
      await fs.copy(
        path.join(TEMPLATE_DIR, 'gitignore.template'),
        gitignorePath
      );
    }

    // 6. 添加版本信息到 settings.json
    if (useClaude) {
      const settingsPath = path.join(claudeDir, 'settings.json');
      if (await fs.pathExists(settingsPath)) {
        const settings = await fs.readJson(settingsPath);
        settings.jvibe = {
          version: require('../package.json').version,
          installedAt: new Date().toISOString(),
          mode: mode,
          adapter: normalizedAdapter
        };
        await fs.writeJson(settingsPath, settings, { spaces: 2 });
      }
    }

    if (useOpencode) {
      const opencodeMetaPath = path.join(opencodeDir, 'jvibe.json');
      const opencodeMeta = {
        version: require('../package.json').version,
        installedAt: new Date().toISOString(),
        mode: mode,
        adapter: normalizedAdapter
      };
      await fs.writeJson(opencodeMetaPath, opencodeMeta, { spaces: 2 });
    }

    // 7. 输出成功信息
    console.log(chalk.green('\n✅ JVibe 初始化完成！\n'));

    console.log(chalk.white('已创建：'));
    if (shouldCopyClaude) {
      console.log(chalk.gray('  - .claude/agents/      (5 个 Sub-Agents)'));
      console.log(chalk.gray('  - .claude/commands/    (5 个 JVibe Skills)'));
      console.log(chalk.gray('  - .claude/hooks/       (4 个自动化 Hooks)'));
      console.log(chalk.gray('  - .claude/settings.json'));
    }
    if (shouldCopyOpencode) {
      console.log(chalk.gray('  - .opencode/agent/     (5 个 Sub-Agents)'));
      console.log(chalk.gray('  - .opencode/command/   (5 个 JVibe Commands)'));
      console.log(chalk.gray('  - .opencode/opencode.jsonc'));
      console.log(chalk.gray('  - .opencode/permissions.yaml'));
      console.log(chalk.gray('  - .opencode/error-handling.md'));
      console.log(chalk.gray('  - .opencode/instructions.md'));
    }

    if (mode === 'full') {
      console.log(chalk.gray('  - docs/core/           (4 个核心文档)'));
      console.log(chalk.gray('  - docs/project/        (项目文档目录)'));
    } else {
      console.log(chalk.gray('  - docs/core/           (4 个核心文档)'));
    }

    const nextSteps = [];
    if (useClaude) {
      nextSteps.push('在 Claude Code 中运行 /JVibe:init 创建项目文档');
    }
    if (useOpencode) {
      nextSteps.push('在 OpenCode 中运行 /jvibe-init 创建项目文档');
    }
    const statusCommand = useClaude && useOpencode
      ? '/JVibe:status 或 /jvibe-status'
      : useClaude
        ? '/JVibe:status'
        : '/jvibe-status';
    nextSteps.push(`运行 ${statusCommand} 查看项目状态`);
    nextSteps.push('开始使用自然语言描述你的需求！');

    console.log(chalk.yellow('\n📝 下一步：'));
    nextSteps.forEach((step, index) => {
      console.log(chalk.white(`  ${index + 1}. ${step}`));
    });
    console.log('');

  } catch (error) {
    console.error(chalk.red('\n❌ 初始化失败：'), error.message);
    process.exit(1);
  }
}

module.exports = init;
