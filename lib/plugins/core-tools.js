const fs = require('fs-extra');
const path = require('path');
const { parsePluginListsFromYaml } = require('./plugins-yaml');

const PLUGIN_REGISTRY_PATH = path.join(__dirname, 'registry.json');

const DEFAULT_CORE_PLUGINS = [
  'serena',
  'filesystem-mcp',
  'context7',
  'agent-browser'
];

async function readJsonIfExists(filePath) {
  try {
    if (!await fs.pathExists(filePath)) return null;
    return await fs.readJson(filePath);
  } catch {
    return null;
  }
}

function substituteTemplateString(value, variables) {
  if (typeof value !== 'string') return value;
  return value.replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (match, key) => (
    Object.prototype.hasOwnProperty.call(variables, key) ? String(variables[key]) : match
  ));
}

function substituteTemplateDeep(value, variables) {
  if (Array.isArray(value)) {
    return value.map(item => substituteTemplateDeep(item, variables));
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = substituteTemplateDeep(v, variables);
    }
    return out;
  }
  return substituteTemplateString(value, variables);
}

function extractNpxPackageArg(template) {
  if (!template || typeof template !== 'object') return null;
  if (template.command !== 'npx') return null;
  const args = Array.isArray(template.args) ? template.args : null;
  if (!args) return null;

  for (const arg of args) {
    if (typeof arg !== 'string') continue;
    if (arg === '-y') continue;
    if (arg.startsWith('-')) continue;
    if (arg.includes('{{')) continue;
    return arg;
  }
  return null;
}

function getRequiredEnvKeys(plugin) {
  const keys = plugin && plugin.requires && Array.isArray(plugin.requires.env)
    ? plugin.requires.env
    : [];
  return keys.filter(k => typeof k === 'string' && k.length > 0);
}

function buildTemplateVariables(plugin, cwd) {
  const requiredEnvKeys = getRequiredEnvKeys(plugin);
  const missingEnvKeys = [];
  const variables = { project_root: cwd };

  for (const key of requiredEnvKeys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.length > 0) {
      variables[key] = value;
    } else {
      missingEnvKeys.push(key);
    }
  }

  return { variables, missingEnvKeys };
}

function stripUnresolvedTemplateEnv(serverConfig) {
  if (!serverConfig || typeof serverConfig !== 'object') return serverConfig;
  if (!serverConfig.env || typeof serverConfig.env !== 'object') return serverConfig;

  const envEntries = Object.entries(serverConfig.env);
  const cleanedEnv = {};

  for (const [key, value] of envEntries) {
    if (typeof value === 'string' && value.includes('{{') && value.includes('}}')) {
      continue;
    }
    cleanedEnv[key] = value;
  }

  if (Object.keys(cleanedEnv).length === envEntries.length) return serverConfig;
  const out = { ...serverConfig };
  if (Object.keys(cleanedEnv).length === 0) {
    delete out.env;
  } else {
    out.env = cleanedEnv;
  }
  return out;
}

async function loadPluginRegistry() {
  try {
    const registry = await fs.readJson(PLUGIN_REGISTRY_PATH);
    const plugins = Array.isArray(registry.plugins) ? registry.plugins : [];
    return { ...registry, plugins };
  } catch {
    return { version: 1, plugins: [] };
  }
}

function getCorePluginIdsFromRegistry(registry) {
  const plugins = Array.isArray(registry.plugins) ? registry.plugins : [];
  const core = plugins
    .filter(p => p && typeof p.id === 'string' && p.default_tier === 'core')
    .map(p => p.id);
  return core.length > 0 ? core : DEFAULT_CORE_PLUGINS;
}

async function getCorePluginIdsFromProject(cwd, registry) {
  const pluginsPath = path.join(cwd, 'docs', '.jvibe', 'plugins.yaml');
  try {
    if (await fs.pathExists(pluginsPath)) {
      const raw = await fs.readFile(pluginsPath, 'utf-8');
      const parsed = parsePluginListsFromYaml(raw);
      const core = Array.isArray(parsed.core_plugins) ? parsed.core_plugins : [];
      if (core.length > 0) return core;
    }
  } catch {
    // ignore
  }
  return getCorePluginIdsFromRegistry(registry);
}

async function fetchSkillFile(url, redirectCount = 0) {
  const https = require('https');
  const http = require('http');
  const MAX_REDIRECTS = 5;
  const TIMEOUT_MS = 10000;
  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

  if (redirectCount > MAX_REDIRECTS) {
    throw new Error(`Too many redirects (>${MAX_REDIRECTS})`);
  }

  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: TIMEOUT_MS }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchSkillFile(res.headers.location, redirectCount + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      let data = '';
      let size = 0;

      res.on('data', chunk => {
        size += chunk.length;
        if (size > MAX_SIZE_BYTES) {
          req.destroy();
          return reject(new Error(`Response too large (>${MAX_SIZE_BYTES} bytes)`));
        }
        data += chunk;
      });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout (>${TIMEOUT_MS}ms)`));
    });
    req.on('error', reject);
  });
}

function checkCommandExists(command) {
  if (!command || typeof command !== 'string') return false;

  // If it's an explicit path, check it directly.
  if (command.includes('/') || command.includes('\\')) {
    try {
      return fs.statSync(command).isFile();
    } catch {
      return false;
    }
  }

  const pathValue = process.env.PATH || '';
  const pathEntries = pathValue.split(path.delimiter).filter(Boolean);
  const isWindows = process.platform === 'win32';
  const pathExts = isWindows
    ? (process.env.PATHEXT ? process.env.PATHEXT.split(';') : ['.EXE', '.CMD', '.BAT', '.COM'])
    : [''];
  const hasWindowsExt = isWindows && /\.[A-Za-z0-9]+$/.test(command);

  for (const dir of pathEntries) {
    if (hasWindowsExt) {
      const fullPath = path.join(dir, command);
      try {
        if (fs.statSync(fullPath).isFile()) return true;
      } catch {
        // continue
      }
      continue;
    }

    for (const ext of pathExts) {
      const fullPath = path.join(dir, isWindows ? `${command}${ext}` : command);
      try {
        if (fs.statSync(fullPath).isFile()) return true;
      } catch {
        // continue
      }
    }
  }

  return false;
}

async function configureSkillPlugin(cwd, plugin, result) {
  const claudeConfig = plugin.claude;
  if (!claudeConfig || !claudeConfig.skillDir || !claudeConfig.skillSource) {
    result.missingTemplates.push(plugin.id);
    return false;
  }

  const skillDir = path.join(cwd, claudeConfig.skillDir);
  const skillFile = path.join(skillDir, 'SKILL.md');
  const cliCommand = claudeConfig.skillName || plugin.id;
  const globalInstall = claudeConfig.globalInstall || null;

  // 检查 Skill 是否已存在
  if (await fs.pathExists(skillFile)) {
    if (globalInstall && cliCommand && !checkCommandExists(cliCommand)) {
      result.skillsNeedingCli.push({
        pluginId: plugin.id,
        skillDir: claudeConfig.skillDir,
        cliCommand,
        globalInstall
      });
    }
    result.skipped += 1;
    return false;
  }

  // 下载 SKILL.md
  try {
    const content = await fetchSkillFile(claudeConfig.skillSource);
    await fs.ensureDir(skillDir);
    await fs.writeFile(skillFile, content, 'utf-8');
    result.added += 1;
    result.skillsAdded.push({ pluginId: plugin.id, skillDir: claudeConfig.skillDir });

    if (globalInstall && cliCommand && !checkCommandExists(cliCommand)) {
      result.skillsNeedingCli.push({
        pluginId: plugin.id,
        skillDir: claudeConfig.skillDir,
        cliCommand,
        globalInstall
      });
    }
    return true;
  } catch (e) {
    result.missingTemplates.push(plugin.id);
    return false;
  }
}

async function configureClaudeCoreTools(cwd, registry) {
  const claudeDir = path.join(cwd, '.claude');
  if (!await fs.pathExists(claudeDir)) {
    return { added: 0, skipped: 0, missingTemplates: [], missingEnv: [], mcpAdded: 0, skillsAdded: [], skillsNeedingCli: [] };
  }

  const settingsPath = path.join(claudeDir, 'settings.json');
  const settingsLocalPath = path.join(claudeDir, 'settings.local.json');

  const settings = await readJsonIfExists(settingsPath) || {};
  const settingsLocal = await readJsonIfExists(settingsLocalPath);

  if (await fs.pathExists(settingsLocalPath) && settingsLocal === null) {
    return { added: 0, skipped: 0, missingTemplates: [], missingEnv: [], mcpAdded: 0, skillsAdded: [], skillsNeedingCli: [], error: 'settings.local.json 解析失败，已跳过自动配置' };
  }

  const local = settingsLocal || {};
  const settingsServers = settings.mcpServers || {};
  const localServers = local.mcpServers || {};
  const existingServers = new Set([
    ...Object.keys(settingsServers),
    ...Object.keys(localServers)
  ]);
  const existingServerConfigs = [
    ...Object.values(settingsServers),
    ...Object.values(localServers)
  ].filter(Boolean);

  const corePluginIds = await getCorePluginIdsFromProject(cwd, registry);

  const result = {
    added: 0,
    skipped: 0,
    missingTemplates: [],
    missingEnv: [],
    mcpAdded: 0,
    skillsNeedingCli: [],
    skillsAdded: []
  };

  let mcpAdded = 0;

  for (const pluginId of corePluginIds) {
    const plugin = registry.plugins.find(p => p && p.id === pluginId);
    if (!plugin) continue;

    const integrationType = plugin.integration && plugin.integration.type;

    // 处理 Skill 类型插件
    if (integrationType === 'skill') {
      await configureSkillPlugin(cwd, plugin, result);
      continue;
    }

    // 处理 MCP 类型插件
    if (integrationType !== 'mcp') continue;

    const { variables, missingEnvKeys } = buildTemplateVariables(plugin, cwd);
    if (missingEnvKeys.length > 0) {
      result.missingEnv.push({ pluginId, keys: missingEnvKeys });
    }

    const serverName = plugin.claude && typeof plugin.claude.mcpServerName === 'string'
      ? plugin.claude.mcpServerName
      : pluginId;
    const aliasNames = new Set([
      pluginId,
      serverName,
      ...((plugin.claude && Array.isArray(plugin.claude.mcpAliases)) ? plugin.claude.mcpAliases : [])
    ]);

    const alreadyConfigured = [...aliasNames].some(name => existingServers.has(name));
    if (alreadyConfigured) {
      result.skipped += 1;
      continue;
    }

    const template = plugin.claude && plugin.claude.mcpServer ? plugin.claude.mcpServer : null;
    if (!template) {
      result.missingTemplates.push(pluginId);
      continue;
    }

    const npxPackageArg = extractNpxPackageArg(template);
    const alreadyConfiguredBySignature = npxPackageArg
      ? existingServerConfigs.some(cfg => (
        cfg &&
        typeof cfg === 'object' &&
        cfg.command === 'npx' &&
        Array.isArray(cfg.args) &&
        cfg.args.includes(npxPackageArg)
      ))
      : false;
    if (alreadyConfiguredBySignature) {
      result.skipped += 1;
      continue;
    }

    const resolved = stripUnresolvedTemplateEnv(substituteTemplateDeep(template, variables));
    local.mcpServers = local.mcpServers || {};
    local.mcpServers[serverName] = resolved;
    existingServers.add(serverName);
    result.added += 1;
    mcpAdded += 1;
  }

  if (mcpAdded > 0) {
    await fs.writeJson(settingsLocalPath, local, { spaces: 2 });
  }

  result.mcpAdded = mcpAdded;
  return result;
}

module.exports = {
  loadPluginRegistry,
  getCorePluginIdsFromRegistry,
  getCorePluginIdsFromProject,
  configureClaudeCoreTools
};
