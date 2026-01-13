#!/usr/bin/env node

/**
 * JVibe CLI - 文档驱动的 AI 辅助开发系统
 *
 * 用法:
 *   jvibe init [--mode=full|minimal]  初始化项目
 *   jvibe upgrade                      升级到最新版本
 *   jvibe status                       查看项目状态
 *   jvibe validate                     验证项目配置
 */

const { Command } = require('commander');
const pkg = require('../package.json');

const program = new Command();

program
  .name('jvibe')
  .description('JVibe - 文档驱动的 AI 辅助开发系统')
  .version(pkg.version);

// init 命令
program
  .command('init')
  .description('初始化 JVibe 项目')
  .option('--mode <type>', '模式: full（完整）或 minimal（最小）', 'full')
  .option('--force', '强制覆盖已存在的文件', false)
  .action(async (options) => {
    const init = require('../scripts/init');
    await init(options);
  });

// upgrade 命令
program
  .command('upgrade')
  .description('升级到最新版本（默认卸载重装）')
  .option('--check', '仅检查更新，不执行升级', false)
  .option('--force', '强制升级，跳过确认', false)
  .option('--migrate', '仅执行迁移，不更新到最新版本', false)
  .action(async (options) => {
    const upgrade = require('../scripts/upgrade');
    await upgrade(options);
  });

// migrate 命令（upgrade --migrate 的别名）
program
  .command('migrate')
  .description('迁移旧版本配置到新格式')
  .option('--force', '强制迁移，跳过确认', false)
  .action(async (options) => {
    const upgrade = require('../scripts/upgrade');
    await upgrade({ ...options, migrate: true });
  });

// uninstall 命令
program
  .command('uninstall')
  .description('卸载项目内的 JVibe 配置与核心文档')
  .option('--purge-project-docs', '同时移除 docs/project', false)
  .option('--no-backup', '不创建备份', false)
  .action(async (options) => {
    const uninstall = require('../scripts/uninstall');
    await uninstall({
      purgeProjectDocs: options.purgeProjectDocs,
      backup: options.backup
    });
  });

// status 命令
program
  .command('status')
  .description('查看项目 JVibe 配置状态')
  .action(async () => {
    const status = require('../scripts/status');
    await status();
  });

// validate 命令
program
  .command('validate')
  .description('验证项目 JVibe 配置')
  .action(async () => {
    const validate = require('../scripts/validate');
    await validate();
  });

program.parse();
