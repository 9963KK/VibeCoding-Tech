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
  .description('升级到最新版本')
  .option('--check', '仅检查更新，不执行升级', false)
  .action(async (options) => {
    const upgrade = require('../scripts/upgrade');
    await upgrade(options);
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
