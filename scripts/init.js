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
 * @param {boolean} options.force - 是否强制覆盖
 */
async function init(options = {}) {
  const mode = options.mode || 'full';
  const force = options.force || false;
  const cwd = process.cwd();

  console.log(chalk.blue('\n🚀 正在初始化 JVibe...\n'));

  try {
    // 1. 检查是否已存在 JVibe 配置
    const claudeDir = path.join(cwd, '.claude');
    if (await fs.pathExists(claudeDir) && !force) {
      console.log(chalk.yellow('⚠️  检测到已存在 .claude/ 目录'));
      console.log(chalk.yellow('   使用 --force 选项强制覆盖'));
      return;
    }

    // 2. 复制 .claude/ 目录
    console.log(chalk.gray('   复制 .claude/ 配置...'));
    await fs.copy(
      path.join(TEMPLATE_DIR, '.claude'),
      claudeDir,
      { overwrite: force }
    );

    // 3. 复制文档目录
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
    }

    // 4. 更新 .gitignore
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

    // 5. 添加版本信息到 settings.json
    const settingsPath = path.join(claudeDir, 'settings.json');
    if (await fs.pathExists(settingsPath)) {
      const settings = await fs.readJson(settingsPath);
      settings.jvibe = {
        version: require('../package.json').version,
        installedAt: new Date().toISOString(),
        mode: mode
      };
      await fs.writeJson(settingsPath, settings, { spaces: 2 });
    }

    // 6. 输出成功信息
    console.log(chalk.green('\n✅ JVibe 初始化完成！\n'));

    console.log(chalk.white('已创建：'));
    console.log(chalk.gray('  - .claude/agents/      (4 个 Sub-Agents)'));
    console.log(chalk.gray('  - .claude/commands/    (3 个 JVibe Skills)'));
    console.log(chalk.gray('  - .claude/hooks/       (3 个自动化 Hooks)'));
    console.log(chalk.gray('  - .claude/settings.json'));

    if (mode === 'full') {
      console.log(chalk.gray('  - docs/core/           (4 个核心文档)'));
      console.log(chalk.gray('  - docs/project/        (项目文档目录)'));
    } else {
      console.log(chalk.gray('  - docs/core/           (4 个核心文档)'));
    }

    console.log(chalk.yellow('\n📝 下一步：'));
    console.log(chalk.white('  1. 在 Claude Code 中运行 /JVibe:init 创建项目文档'));
    console.log(chalk.white('  2. 运行 /JVibe:status 查看项目状态'));
    console.log(chalk.white('  3. 开始使用自然语言描述你的需求！\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ 初始化失败：'), error.message);
    process.exit(1);
  }
}

module.exports = init;
