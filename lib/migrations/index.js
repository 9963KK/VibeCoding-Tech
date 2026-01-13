/**
 * JVibe 版本迁移配置
 * 记录每个版本的文档格式变更，供 AI 迁移时参考
 */

/**
 * 迁移配置结构
 * @typedef {Object} MigrationConfig
 * @property {string} version - 版本号
 * @property {string} description - 版本描述
 * @property {Object} changes - 变更内容
 * @property {Object[]} changes.added - 新增字段/章节
 * @property {Object[]} changes.modified - 修改的字段/格式
 * @property {Object[]} changes.removed - 移除的字段
 * @property {Object[]} changes.renamed - 重命名的字段
 * @property {string[]} aiMigrationRequired - 需要 AI 介入迁移的文件
 */

/**
 * 版本迁移配置列表（按版本号升序排列）
 */
const MIGRATIONS = [
  {
    version: '1.0.0',
    description: '初始版本',
    changes: {
      added: [],
      modified: [],
      removed: [],
      renamed: []
    },
    aiMigrationRequired: []
  },
  {
    version: '1.0.3',
    description: '修复 hooks 脚本问题',
    changes: {
      added: [],
      modified: [
        {
          file: '.claude/hooks/sync-stats.sh',
          description: '修复 grep -c 导致的算术错误，改用 awk'
        }
      ],
      removed: [],
      renamed: []
    },
    aiMigrationRequired: []
  },
  {
    version: '1.0.7',
    description: '核心文档英文命名与引用更新',
    changes: {
      added: [],
      modified: [],
      removed: [],
      renamed: [
        {
          file: 'docs/core/Standards.md',
          field: 'core-docs-rename',
          description: '核心文档更名为英文（Standards/Project/Feature-List/Appendix）并更新文档内引用'
        }
      ]
    },
    aiMigrationRequired: [
      'docs/core/Standards.md',
      'docs/core/Project.md',
      'docs/core/Feature-List.md',
      'docs/core/Appendix.md'
    ]
  },
  {
    version: '1.1.0',
    description: '文档格式增强',
    changes: {
      added: [
        {
          file: 'docs/core/Feature-List.md',
          field: '优先级',
          description: '功能条目新增优先级字段（P0/P1/P2/P3）',
          format: '**优先级**：P0 | P1 | P2 | P3',
          example: '**优先级**：P1'
        },
        {
          file: 'docs/core/Feature-List.md',
          field: '预估工时',
          description: '功能条目新增预估工时字段',
          format: '**预估工时**：Xh | Xd',
          example: '**预估工时**：4h'
        },
        {
          file: 'docs/core/Feature-List.md',
          field: '关联模块',
          description: '功能条目新增关联模块字段',
          format: '**关联模块**：ModuleName',
          example: '**关联模块**：AuthModule'
        },
        {
          file: 'docs/core/Project.md',
          field: '环境配置',
          section: '## 7. 环境配置',
          description: '新增环境配置章节，记录环境变量和配置项'
        }
      ],
      modified: [
        {
          file: 'docs/core/Feature-List.md',
          field: '功能条目格式',
          description: '功能条目格式扩展，支持更多元数据',
          oldFormat: '## F-XXX [状态] 功能名称\n\n**描述**：...\n\n**TODO**\n- [ ] ...',
          newFormat: '## F-XXX [状态] 功能名称\n\n**描述**：...\n**优先级**：P1\n**预估工时**：4h\n**关联模块**：ModuleName\n\n**TODO**\n- [ ] ...'
        }
      ],
      removed: [],
      renamed: []
    },
    aiMigrationRequired: [
      'docs/core/Feature-List.md',
      'docs/core/Project.md'
    ]
  }
];

/**
 * 获取从指定版本到最新版本的所有迁移
 * @param {string} fromVersion - 起始版本
 * @returns {MigrationConfig[]}
 */
function getMigrationsFrom(fromVersion) {
  const fromIndex = MIGRATIONS.findIndex(m => m.version === fromVersion);
  if (fromIndex === -1) {
    // 如果找不到版本，返回所有迁移
    return MIGRATIONS;
  }
  return MIGRATIONS.slice(fromIndex + 1);
}

/**
 * 获取最新版本号
 * @returns {string}
 */
function getLatestVersion() {
  return MIGRATIONS[MIGRATIONS.length - 1].version;
}

/**
 * 检查是否需要 AI 迁移
 * @param {string} fromVersion - 起始版本
 * @returns {Object}
 */
function checkAIMigrationRequired(fromVersion) {
  const migrations = getMigrationsFrom(fromVersion);
  const filesRequiringAI = new Set();
  const allChanges = {
    added: [],
    modified: [],
    removed: [],
    renamed: []
  };

  for (const migration of migrations) {
    // 收集需要 AI 迁移的文件
    for (const file of migration.aiMigrationRequired) {
      filesRequiringAI.add(file);
    }

    // 合并所有变更
    allChanges.added.push(...migration.changes.added);
    allChanges.modified.push(...migration.changes.modified);
    allChanges.removed.push(...migration.changes.removed);
    allChanges.renamed.push(...migration.changes.renamed);
  }

  return {
    required: filesRequiringAI.size > 0,
    files: Array.from(filesRequiringAI),
    changes: allChanges,
    migrations: migrations
  };
}

/**
 * 生成 AI 迁移提示
 * @param {string} fromVersion - 起始版本
 * @returns {string}
 */
function generateMigrationPrompt(fromVersion) {
  const result = checkAIMigrationRequired(fromVersion);
  if (!result.required) {
    return null;
  }

  let prompt = `# JVibe 文档迁移指南\n\n`;
  prompt += `从版本 ${fromVersion} 迁移到 ${getLatestVersion()}\n\n`;

  if (result.changes.added.length > 0) {
    prompt += `## 新增字段\n\n`;
    for (const change of result.changes.added) {
      prompt += `### ${change.file} - ${change.field || change.section}\n`;
      prompt += `- **描述**：${change.description}\n`;
      if (change.format) prompt += `- **格式**：\`${change.format}\`\n`;
      if (change.example) prompt += `- **示例**：\`${change.example}\`\n`;
      prompt += `\n`;
    }
  }

  if (result.changes.modified.length > 0) {
    prompt += `## 修改的格式\n\n`;
    for (const change of result.changes.modified) {
      prompt += `### ${change.file} - ${change.field}\n`;
      prompt += `- **描述**：${change.description}\n`;
      if (change.oldFormat) prompt += `- **旧格式**：\n\`\`\`\n${change.oldFormat}\n\`\`\`\n`;
      if (change.newFormat) prompt += `- **新格式**：\n\`\`\`\n${change.newFormat}\n\`\`\`\n`;
      prompt += `\n`;
    }
  }

  if (result.changes.removed.length > 0) {
    prompt += `## 移除的字段\n\n`;
    for (const change of result.changes.removed) {
      prompt += `- ${change.file}: ${change.field} - ${change.description}\n`;
    }
    prompt += `\n`;
  }

  if (result.changes.renamed.length > 0) {
    prompt += `## 重命名的字段\n\n`;
    for (const change of result.changes.renamed) {
      const renameLabel = change.oldName && change.newName
        ? `${change.oldName} → ${change.newName}`
        : (change.field || change.description || '重命名');
      prompt += `- ${change.file}: ${renameLabel}\n`;
      if (change.description && renameLabel !== change.description) {
        prompt += `  - ${change.description}\n`;
      }
    }
    prompt += `\n`;
  }

  prompt += `## 需要迁移的文件\n\n`;
  for (const file of result.files) {
    prompt += `- ${file}\n`;
  }

  return prompt;
}

module.exports = {
  MIGRATIONS,
  getMigrationsFrom,
  getLatestVersion,
  checkAIMigrationRequired,
  generateMigrationPrompt
};
