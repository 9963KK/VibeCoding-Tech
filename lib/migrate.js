/**
 * JVibe Migration Module
 * 旧版本检测和迁移工具
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const pkg = require('../package.json');

// 尝试加载迁移配置（可能不存在）
let migrationsConfig = null;
try {
  migrationsConfig = require('./migrations');
} catch (e) {
  // 迁移配置文件不存在，使用内置检测
}

const CORE_DOCS = ['Standards.md', 'Project.md', 'Feature-List.md', 'Appendix.md'];
const LEGACY_CORE_DOCS = ['规范文档.md', '项目文档.md', '功能清单.md', '附加材料.md'];
const CORE_DOC_RENAMES = [
  { from: '规范文档.md', to: 'Standards.md' },
  { from: '项目文档.md', to: 'Project.md' },
  { from: '功能清单.md', to: 'Feature-List.md' },
  { from: '附加材料.md', to: 'Appendix.md' }
];

async function listMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeHeadingText(text) {
  return text
    .replace(/^[\d.\-、()]+\s*/g, '')
    .replace(/\s*[（(][^）)]*[）)]\s*$/g, '')
    .replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}]+\s*/gu, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function extractHeadings(content, levels) {
  const headings = new Set();
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^(#{2,6})\s+(.+)$/);
    if (!match) {
      continue;
    }
    const level = match[1].length;
    if (!levels.includes(level)) {
      continue;
    }
    const normalized = normalizeHeadingText(match[2]);
    if (normalized) {
      headings.add(normalized);
    }
  }
  return headings;
}

function extractFeatureFieldsFromTemplate(content) {
  const lines = content.split(/\r?\n/);
  let startIndex = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^##\s+F-\d+/m.test(lines[i])) {
      startIndex = i;
      break;
    }
  }
  if (startIndex === -1) {
    return [];
  }
  let endIndex = lines.length;
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    if (/^##\s+F-\d+/m.test(lines[i])) {
      endIndex = i;
      break;
    }
  }
  const fields = new Set();
  for (const line of lines.slice(startIndex, endIndex)) {
    const match = line.match(/^\*\*(.+?)\*\*/);
    if (match) {
      const fieldName = match[1].trim();
      if (fieldName) {
        fields.add(fieldName);
      }
    }
  }
  return [...fields];
}

function extractFeatureBlocks(content) {
  const lines = content.split(/\r?\n/);
  const blocks = [];
  let startIndex = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^##\s+F-\d+/m.test(lines[i])) {
      if (startIndex >= 0) {
        blocks.push(lines.slice(startIndex, i).join('\n'));
      }
      startIndex = i;
    }
  }
  if (startIndex >= 0) {
    blocks.push(lines.slice(startIndex).join('\n'));
  }
  return blocks;
}

async function findFirstExistingFile(projectDir, candidates) {
  for (const candidate of candidates) {
    const fullPath = path.join(projectDir, candidate);
    if (await fs.pathExists(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

async function compareDocsToTemplate(projectDir) {
  const result = {
    applied: false,
    required: false,
    files: [],
    missingFields: [],
    changes: []
  };

  const templateCoreDir = path.resolve(__dirname, '..', 'template', 'docs', 'core');
  if (!await fs.pathExists(templateCoreDir)) {
    return result;
  }
  result.applied = true;

  const docCandidates = {
    'Standards.md': [
      'docs/core/Standards.md',
      'docs/Standards.md',
      'docs/core/规范文档.md',
      'docs/规范文档.md'
    ],
    'Project.md': [
      'docs/core/Project.md',
      'docs/Project.md',
      'docs/core/项目文档.md',
      'docs/项目文档.md'
    ],
    'Feature-List.md': [
      'docs/core/Feature-List.md',
      'docs/Feature-List.md',
      'docs/core/功能清单.md',
      'docs/功能清单.md'
    ],
    'Appendix.md': [
      'docs/core/Appendix.md',
      'docs/Appendix.md',
      'docs/core/附加材料.md',
      'docs/附加材料.md'
    ]
  };

  for (const [templateName, candidates] of Object.entries(docCandidates)) {
    const templatePath = path.join(templateCoreDir, templateName);
    if (!await fs.pathExists(templatePath)) {
      continue;
    }

    const projectPath = await findFirstExistingFile(projectDir, candidates);
    if (!projectPath) {
      continue;
    }

    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const projectContent = await fs.readFile(projectPath, 'utf-8');

    if (templateName === 'Feature-List.md') {
      const requiredFields = extractFeatureFieldsFromTemplate(templateContent);
      if (requiredFields.length === 0) {
        continue;
      }
      const featureBlocks = extractFeatureBlocks(projectContent);
      if (featureBlocks.length === 0) {
        continue;
      }
      const missingFields = new Set();
      for (const block of featureBlocks) {
        for (const field of requiredFields) {
          const pattern = new RegExp(`\\*\\*${escapeRegExp(field)}\\*\\*\\s*(：|:)?`, 'm');
          if (!pattern.test(block)) {
            missingFields.add(field);
          }
        }
      }
      if (missingFields.size > 0) {
        result.required = true;
        result.files.push(projectPath);
        const missingList = [...missingFields];
        result.missingFields.push(...missingList);
        result.changes.push({
          file: path.relative(projectDir, projectPath),
          type: 'missing_fields',
          fields: missingList,
          description: `功能清单与模板字段不一致，缺少：${missingList.join('、')}`
        });
      }
      continue;
    }

    const templateHeadings = extractHeadings(templateContent, [2]);
    const projectHeadings = extractHeadings(projectContent, [2]);
    const missingSections = [];
    for (const heading of templateHeadings) {
      if (!projectHeadings.has(heading)) {
        missingSections.push(heading);
      }
    }
    if (missingSections.length > 0) {
      result.required = true;
      result.files.push(projectPath);
      result.changes.push({
        file: path.relative(projectDir, projectPath),
        type: 'missing_sections',
        sections: missingSections,
        description: `文档缺少模板中的章节：${missingSections.join('、')}`
      });
    }
  }

  if (result.files.length > 0) {
    result.files = [...new Set(result.files)];
  }

  return result;
}

/**
 * 版本检测结果
 * @typedef {Object} VersionInfo
 * @property {string|null} version - 当前版本号
 * @property {boolean} isLegacy - 是否为旧版本
 * @property {string[]} legacyIndicators - 旧版本特征列表
 * @property {Object} structure - 目录结构分析
 * @property {Object} contentMigration - 内容迁移信息
 */

/**
 * 迁移计划
 * @typedef {Object} MigrationPlan
 * @property {boolean} needsMigration - 是否需要迁移
 * @property {boolean} needsAIMigration - 是否需要 AI 介入迁移
 * @property {string[]} tasks - 迁移任务列表
 * @property {string[]} aiTasks - 需要 AI 处理的任务
 * @property {Object} details - 详细迁移信息
 */

/**
 * 检测项目的 JVibe 版本和结构
 * @param {string} projectDir - 项目目录
 * @returns {Promise<VersionInfo>}
 */
async function detectVersion(projectDir) {
  const result = {
    version: null,
    isLegacy: false,
    legacyIndicators: [],
    structure: {
      hasClaudeDir: false,
      hasSettingsJson: false,
      hasAgents: false,
      hasCommands: false,
      hasHooks: false,
      hasDocsCoreDir: false,
      hasDocsProjectDir: false,
      hasLegacyDocs: false,
      hasJvibeState: false
    },
    contentMigration: {
      required: false,
      files: [],
      missingFields: []
    }
  };

  const claudeDir = path.join(projectDir, '.claude');
  const settingsPath = path.join(claudeDir, 'settings.json');
  const docsDir = path.join(projectDir, 'docs');
  const coreDir = path.join(docsDir, 'core');
  const projectDocsDir = path.join(docsDir, 'project');

  // 检查 .claude 目录
  if (await fs.pathExists(claudeDir)) {
    result.structure.hasClaudeDir = true;

    // 检查 settings.json
    if (await fs.pathExists(settingsPath)) {
      result.structure.hasSettingsJson = true;
      try {
        const settings = await fs.readJson(settingsPath);
        result.version = settings.jvibe?.version || null;
      } catch (e) {
        result.legacyIndicators.push('settings.json 格式错误或损坏');
      }
    }

    // 检查子目录
    result.structure.hasAgents = await fs.pathExists(path.join(claudeDir, 'agents'));
    result.structure.hasCommands = await fs.pathExists(path.join(claudeDir, 'commands'));
    result.structure.hasHooks = await fs.pathExists(path.join(claudeDir, 'hooks'));
  }

  // 检查文档目录
  if (await fs.pathExists(docsDir)) {
    result.structure.hasDocsCoreDir = await fs.pathExists(coreDir);
    result.structure.hasDocsProjectDir = await fs.pathExists(projectDocsDir);

    // 检查是否有旧版本的文档结构（直接放在 docs/ 下）
    const legacyDocs = [...CORE_DOCS, ...LEGACY_CORE_DOCS];
    for (const doc of legacyDocs) {
      if (await fs.pathExists(path.join(docsDir, doc))) {
        result.structure.hasLegacyDocs = true;
        result.legacyIndicators.push(`发现旧位置文档: docs/${doc}`);
      }
    }

    for (const doc of LEGACY_CORE_DOCS) {
      if (await fs.pathExists(path.join(coreDir, doc))) {
        result.structure.hasLegacyDocs = true;
        result.legacyIndicators.push(`发现旧命名文档: docs/core/${doc}`);
      }
    }
  }

  // 检查 .jvibe-state.json
  result.structure.hasJvibeState = await fs.pathExists(path.join(docsDir, '.jvibe-state.json'));

  // 判断是否为旧版本
  result.isLegacy = await checkIsLegacy(projectDir, result);

  // 检测内容迁移需求
  result.contentMigration = await checkContentMigration(projectDir, result.version);

  return result;
}

/**
 * 检查是否为旧版本
 * @param {string} projectDir - 项目目录
 * @param {VersionInfo} versionInfo - 版本信息
 * @returns {Promise<boolean>}
 */
async function checkIsLegacy(projectDir, versionInfo) {
  // 没有版本信息的项目被视为旧版本
  if (!versionInfo.version) {
    versionInfo.legacyIndicators.push('缺少版本信息');
    return true;
  }

  // 有旧位置文档的项目被视为旧版本
  if (versionInfo.structure.hasLegacyDocs) {
    return true;
  }

  // 检查 commands 命名格式（旧版本可能使用 init.md 而不是 JVibe:init.md）
  const commandsDir = path.join(projectDir, '.claude/commands');
  if (await fs.pathExists(commandsDir)) {
    const files = await fs.readdir(commandsDir);
    const legacyCommands = files.filter(f => !f.startsWith('JVibe:') && f.endsWith('.md'));
    if (legacyCommands.length > 0) {
      versionInfo.legacyIndicators.push(`发现旧命名格式的 commands: ${legacyCommands.join(', ')}`);
      return true;
    }
  }

  // 检查 hooks 是否有旧版本问题
  const hooksDir = path.join(projectDir, '.claude/hooks');
  if (await fs.pathExists(hooksDir)) {
    const legacyHookIssues = await checkLegacyHooks(hooksDir);
    if (legacyHookIssues.length > 0) {
      versionInfo.legacyIndicators.push(...legacyHookIssues);
      return true;
    }
  }

  return false;
}

/**
 * 检查旧版本的 hooks 问题
 * @param {string} hooksDir - hooks 目录
 * @returns {Promise<string[]>}
 */
async function checkLegacyHooks(hooksDir) {
  const issues = [];
  const hookFiles = ['load-context.sh', 'sync-feature-status.sh', 'sync-stats.sh'];

  for (const hookFile of hookFiles) {
    const hookPath = path.join(hooksDir, hookFile);
    if (await fs.pathExists(hookPath)) {
      const content = await fs.readFile(hookPath, 'utf-8');

      // 检查旧版本的 sync-stats.sh 问题（使用 grep -c 而不是 awk）
      if (hookFile === 'sync-stats.sh') {
        if (content.includes('grep -c') && !content.includes('count_status()')) {
          issues.push('sync-stats.sh 使用旧版 grep -c 语法（可能导致错误）');
        }
      }

      // 检查旧版本的路径问题
      const hasLegacyFeatureListPath = content.includes('docs/Feature-List.md') && !content.includes('docs/core/Feature-List.md');
      const hasLegacyChineseFeatureListPath = content.includes('docs/功能清单.md') && !content.includes('docs/core/Feature-List.md');
      if (hasLegacyFeatureListPath || hasLegacyChineseFeatureListPath) {
        issues.push(`${hookFile} 使用旧版文档路径`);
      }
    }
  }

  return issues;
}

/**
 * 检测文档内容迁移需求
 * @param {string} projectDir - 项目目录
 * @param {string|null} currentVersion - 当前版本
 * @returns {Promise<Object>}
 */
async function checkContentMigration(projectDir, currentVersion) {
  const result = {
    required: false,
    files: [],
    missingFields: [],
    changes: []
  };

  // 检查是否存在旧的核心文档名称引用（需要 AI 更新链接/引用）
  const docsDir = path.join(projectDir, 'docs');
  if (await fs.pathExists(docsDir)) {
    const mdFiles = await listMarkdownFiles(docsDir);
    const filesWithLegacyRefs = [];

    for (const filePath of mdFiles) {
      const content = await fs.readFile(filePath, 'utf-8');
      const hasLegacyRef = LEGACY_CORE_DOCS.some(name => content.includes(name));
      if (hasLegacyRef) {
        filesWithLegacyRefs.push(filePath);
      }
    }

    if (filesWithLegacyRefs.length > 0) {
      result.required = true;
      for (const filePath of filesWithLegacyRefs) {
        if (!result.files.includes(filePath)) {
          result.files.push(filePath);
        }
      }
      result.changes.push({
        file: 'docs/**',
        type: 'legacy_doc_refs',
        description: '文档内引用仍使用旧中文名称，需更新为英文命名（规范文档/项目文档/功能清单/附加材料）'
      });
    }
  }

  const templateComparison = await compareDocsToTemplate(projectDir);
  if (templateComparison.applied) {
    if (templateComparison.required) {
      result.required = true;
      result.files = [...new Set([...result.files, ...templateComparison.files])];
      result.missingFields.push(...templateComparison.missingFields);
      result.changes.push(...templateComparison.changes);
    }
    const latestVersion = pkg.version || null;
    if (latestVersion && currentVersion && currentVersion !== latestVersion) {
      result.required = true;
      result.changes.push({
        file: 'docs/core/*.md',
        type: 'rebuild',
        description: '核心文档需要强制重构（以 template/docs/core 为准）'
      });
    }
  }

  // 模板检测后继续合并版本迁移配置
  if (migrationsConfig && currentVersion) {
    const configResult = migrationsConfig.checkAIMigrationRequired(currentVersion);
    if (configResult.required) {
      result.required = true;
      result.files = [...new Set([...result.files, ...configResult.files])];
      result.changes.push(...configResult.changes.added.map(c => ({
        file: c.file,
        type: 'new_field',
        field: c.field,
        description: c.description
      })));
      result.changes.push(...configResult.changes.modified.map(c => ({
        file: c.file,
        type: 'modified_field',
        field: c.field || c.section,
        description: c.description
      })));
      result.changes.push(...configResult.changes.renamed.map(c => ({
        file: c.file,
        type: 'renamed',
        field: c.field,
        description: c.description
      })));
    }
  }

  return result;
}

/**
 * 生成迁移计划
 * @param {string} projectDir - 项目目录
 * @param {VersionInfo} versionInfo - 版本信息
 * @returns {Promise<MigrationPlan>}
 */
async function getMigrationPlan(projectDir, versionInfo) {
  const plan = {
    needsMigration: versionInfo.isLegacy,
    needsAIMigration: versionInfo.contentMigration.required,
    tasks: [],
    aiTasks: [],
    details: {
      docsToMove: [],
      hooksToUpdate: [],
      commandsToRename: [],
      agentsToUpdate: [],
      configToUpdate: false,
      contentChanges: versionInfo.contentMigration.changes || []
    }
  };

  // 添加 AI 迁移任务
  if (versionInfo.contentMigration.required) {
    for (const change of versionInfo.contentMigration.changes) {
      plan.aiTasks.push(change.description);
    }
  }

  if (!versionInfo.isLegacy && !versionInfo.contentMigration.required) {
    return plan;
  }

  const docsDir = path.join(projectDir, 'docs');
  const coreDir = path.join(docsDir, 'core');

  // 1. 检查文档迁移需求
  const docMoves = [
    ...CORE_DOCS.map(doc => ({ from: doc, to: `core/${doc}` })),
    ...CORE_DOC_RENAMES.map(doc => ({ from: doc.from, to: `core/${doc.to}` })),
    ...CORE_DOC_RENAMES.map(doc => ({ from: `core/${doc.from}`, to: `core/${doc.to}` }))
  ];
  const seenMoves = new Set();

  for (const move of docMoves) {
    const key = `${move.from}=>${move.to}`;
    if (seenMoves.has(key)) {
      continue;
    }
    seenMoves.add(key);

    const legacyPath = path.join(docsDir, move.from);
    const newPath = path.join(docsDir, move.to);

    if (await fs.pathExists(legacyPath) && !await fs.pathExists(newPath)) {
      plan.details.docsToMove.push({ from: move.from, to: move.to });
      plan.tasks.push(`迁移文档: docs/${move.from} → docs/${move.to}`);
    }
  }

  // 2. 检查 hooks 更新需求
  const hooksDir = path.join(projectDir, '.claude/hooks');
  if (await fs.pathExists(hooksDir)) {
    const hookFiles = await fs.readdir(hooksDir);
    const legacyHookIssues = await checkLegacyHooks(hooksDir);
    if (legacyHookIssues.length > 0) {
      plan.details.hooksToUpdate = hookFiles.filter(f => f.endsWith('.sh'));
      plan.tasks.push('更新 hooks 脚本到最新版本');
    }
  }

  // 3. 检查 commands 重命名需求
  const commandsDir = path.join(projectDir, '.claude/commands');
  if (await fs.pathExists(commandsDir)) {
    const files = await fs.readdir(commandsDir);
    const legacyCommands = files.filter(f => !f.startsWith('JVibe:') && f.endsWith('.md'));

    for (const cmd of legacyCommands) {
      const baseName = path.basename(cmd, '.md');
      const newName = `JVibe:${baseName}.md`;
      plan.details.commandsToRename.push({ from: cmd, to: newName });
      plan.tasks.push(`重命名 command: ${cmd} → ${newName}`);
    }
  }

  // 4. 检查 agents 更新需求
  const agentsDir = path.join(projectDir, '.claude/agents');
  if (await fs.pathExists(agentsDir)) {
    plan.details.agentsToUpdate = ['planner.md', 'developer.md', 'reviewer.md', 'doc-sync.md'];
    plan.tasks.push('更新所有 agents 到最新版本');
  }

  // 5. 配置更新
  if (!versionInfo.version) {
    plan.details.configToUpdate = true;
    plan.tasks.push('更新 settings.json 添加版本信息');
  }

  return plan;
}

/**
 * 执行文档结构迁移
 * @param {string} projectDir - 项目目录
 * @param {MigrationPlan} plan - 迁移计划
 */
async function migrateDocsStructure(projectDir, plan) {
  const docsDir = path.join(projectDir, 'docs');
  const coreDir = path.join(docsDir, 'core');

  // 确保 core 目录存在
  await fs.ensureDir(coreDir);

  for (const docMove of plan.details.docsToMove) {
    const fromPath = path.join(docsDir, docMove.from);
    const toPath = path.join(docsDir, docMove.to);

    console.log(chalk.gray(`   迁移 ${docMove.from} → ${docMove.to}`));

    // 移动文件（保留原文件内容）
    await fs.move(fromPath, toPath, { overwrite: false });
  }
}

/**
 * 执行 hooks 迁移
 * @param {string} projectDir - 项目目录
 * @param {string} templateDir - 模板目录
 */
async function migrateHooks(projectDir, templateDir) {
  const projectHooksDir = path.join(projectDir, '.claude/hooks');
  const templateHooksDir = path.join(templateDir, '.claude/hooks');

  // 备份旧 hooks
  const backupDir = path.join(projectDir, '.claude/hooks-backup');
  if (await fs.pathExists(projectHooksDir)) {
    await fs.copy(projectHooksDir, backupDir);
  }

  // 复制新 hooks
  await fs.copy(templateHooksDir, projectHooksDir, { overwrite: true });

  console.log(chalk.gray('   已更新 hooks（旧版本备份在 .claude/hooks-backup/）'));
}

/**
 * 执行 commands 迁移（重命名）
 * @param {string} projectDir - 项目目录
 * @param {string} templateDir - 模板目录
 * @param {MigrationPlan} plan - 迁移计划
 */
async function migrateCommands(projectDir, templateDir, plan) {
  const commandsDir = path.join(projectDir, '.claude/commands');
  const templateCommandsDir = path.join(templateDir, '.claude/commands');

  // 直接用新版本覆盖（旧版本命名不兼容）
  await fs.copy(templateCommandsDir, commandsDir, { overwrite: true });

  // 删除旧命名的文件
  for (const cmd of plan.details.commandsToRename) {
    const oldPath = path.join(commandsDir, cmd.from);
    if (await fs.pathExists(oldPath)) {
      await fs.remove(oldPath);
    }
  }

  console.log(chalk.gray('   已更新 commands'));
}

/**
 * 执行 agents 迁移
 * @param {string} projectDir - 项目目录
 * @param {string} templateDir - 模板目录
 */
async function migrateAgents(projectDir, templateDir) {
  const projectAgentsDir = path.join(projectDir, '.claude/agents');
  const templateAgentsDir = path.join(templateDir, '.claude/agents');

  await fs.copy(templateAgentsDir, projectAgentsDir, { overwrite: true });

  console.log(chalk.gray('   已更新 agents'));
}

/**
 * 更新配置文件
 * @param {string} projectDir - 项目目录
 * @param {string} newVersion - 新版本号
 */
async function updateConfig(projectDir, newVersion) {
  const settingsPath = path.join(projectDir, '.claude/settings.json');

  let settings = {};
  if (await fs.pathExists(settingsPath)) {
    try {
      settings = await fs.readJson(settingsPath);
    } catch (e) {
      // 如果读取失败，创建新的配置
    }
  }

  settings.jvibe = {
    ...settings.jvibe,
    version: newVersion,
    migratedAt: new Date().toISOString()
  };

  await fs.writeJson(settingsPath, settings, { spaces: 2 });
  console.log(chalk.gray('   已更新版本信息'));
}

/**
 * 迁移功能清单格式（如果需要）
 * @param {string} projectDir - 项目目录
 */
async function migrateFeatureList(projectDir) {
  const featureListPaths = [
    path.join(projectDir, 'docs/core/Feature-List.md'),
    path.join(projectDir, 'docs/Feature-List.md'),
    path.join(projectDir, 'docs/core/功能清单.md'),
    path.join(projectDir, 'docs/功能清单.md')
  ];

  for (const featurePath of featureListPaths) {
    if (!await fs.pathExists(featurePath)) {
      continue;
    }

    let content = await fs.readFile(featurePath, 'utf-8');
    let modified = false;

    // 检查并修复旧格式的功能条目
    // 旧格式可能是: ## F-001 [已完成] 功能名
    // 新格式应该是: ## F-001 ✅ 功能名

    const statusMappings = [
      { old: /\[已完成\]/g, new: '✅' },
      { old: /\[开发中\]/g, new: '🚧' },
      { old: /\[未开始\]/g, new: '❌' },
      { old: /\[完成\]/g, new: '✅' },
      { old: /\[进行中\]/g, new: '🚧' },
      { old: /\[待开发\]/g, new: '❌' }
    ];

    for (const mapping of statusMappings) {
      if (mapping.old.test(content)) {
        content = content.replace(mapping.old, mapping.new);
        modified = true;
      }
    }

    if (modified) {
      // 备份原文件
      await fs.copy(featurePath, featurePath + '.bak');
      await fs.writeFile(featurePath, content, 'utf-8');
      console.log(chalk.gray(`   已迁移功能清单格式 (备份: ${path.basename(featurePath)}.bak)`));
    }
  }
}

/**
 * 执行完整迁移
 * @param {string} projectDir - 项目目录
 * @param {string} templateDir - 模板目录
 * @param {MigrationPlan} plan - 迁移计划
 * @param {string} newVersion - 新版本号
 */
async function executeMigration(projectDir, templateDir, plan, newVersion) {
  console.log(chalk.yellow('\n📦 正在执行迁移...\n'));

  // 1. 迁移文档结构
  if (plan.details.docsToMove.length > 0) {
    console.log(chalk.gray('   迁移文档结构...'));
    await migrateDocsStructure(projectDir, plan);
  }

  // 2. 迁移功能清单格式
  console.log(chalk.gray('   检查功能清单格式...'));
  await migrateFeatureList(projectDir);

  // 3. 迁移 hooks
  if (plan.details.hooksToUpdate.length > 0) {
    console.log(chalk.gray('   更新 hooks...'));
    await migrateHooks(projectDir, templateDir);
  }

  // 4. 迁移 commands
  if (plan.details.commandsToRename.length > 0) {
    console.log(chalk.gray('   更新 commands...'));
    await migrateCommands(projectDir, templateDir, plan);
  }

  // 5. 迁移 agents
  if (plan.details.agentsToUpdate.length > 0) {
    console.log(chalk.gray('   更新 agents...'));
    await migrateAgents(projectDir, templateDir);
  }

  // 6. 更新配置
  if (plan.details.configToUpdate) {
    console.log(chalk.gray('   更新配置...'));
    await updateConfig(projectDir, newVersion);
  }
}

/**
 * 打印迁移计划摘要
 * @param {VersionInfo} versionInfo - 版本信息
 * @param {MigrationPlan} plan - 迁移计划
 */
function printMigrationSummary(versionInfo, plan) {
  console.log(chalk.blue('\n🔍 版本检测结果\n'));

  console.log(chalk.gray(`   当前版本: ${versionInfo.version || '未知（旧版本）'}`));
  console.log(chalk.gray(`   是否需要迁移: ${plan.needsMigration ? '是' : '否'}`));
  console.log(chalk.gray(`   是否需要 AI 内容迁移: ${plan.needsAIMigration ? '是' : '否'}`));

  if (versionInfo.legacyIndicators.length > 0) {
    console.log(chalk.yellow('\n   检测到的旧版本特征:'));
    for (const indicator of versionInfo.legacyIndicators) {
      console.log(chalk.yellow(`   - ${indicator}`));
    }
  }

  if (plan.tasks.length > 0) {
    console.log(chalk.cyan('\n   自动迁移任务:'));
    for (const task of plan.tasks) {
      console.log(chalk.cyan(`   - ${task}`));
    }
  }

  if (plan.aiTasks.length > 0) {
    console.log(chalk.magenta('\n   需要 AI 介入的迁移任务:'));
    for (const task of plan.aiTasks) {
      console.log(chalk.magenta(`   - ${task}`));
    }
    console.log(chalk.yellow('\n   💡 提示: 完成自动迁移后，请在 Claude Code 中运行 /JVibe:migrate'));
  }
}

module.exports = {
  detectVersion,
  getMigrationPlan,
  executeMigration,
  printMigrationSummary,
  migrateDocsStructure,
  migrateHooks,
  migrateCommands,
  migrateAgents,
  migrateFeatureList,
  updateConfig
};
