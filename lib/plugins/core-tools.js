const fs = require('fs-extra');
const path = require('path');

const PLUGIN_REGISTRY_PATH = path.join(__dirname, 'registry.json');

const DEFAULT_CORE_PLUGINS = [
  'serena',
  'filesystem-mcp',
  'github-mcp',
  'context7',
  'agent-browser'
];

function stripYamlComment(line) {
  const index = line.indexOf('#');
  return index === -1 ? line : line.slice(0, index);
}

function parsePluginListsFromYaml(content) {
  const result = {};
  let currentKey = null;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = stripYamlComment(rawLine).trim();
    if (!line) {
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (keyMatch) {
      const key = keyMatch[1];
      const value = keyMatch[2].trim();
      currentKey = null;

      if (value === '' || value === '[]') {
        result[key] = [];
        if (value === '') {
          currentKey = key;
        }
        continue;
      }

      result[key] = value.replace(/^['"]|['"]$/g, '');
      continue;
    }

    const itemMatch = line.match(/^-+\s*(.+)$/);
    if (itemMatch && currentKey) {
      const item = itemMatch[1].trim().replace(/^['"]|['"]$/g, '');
      if (item) {
        result[currentKey].push(item);
      }
    }
  }

  return result;
}

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

async function configureClaudeCoreTools(cwd, registry) {
  const claudeDir = path.join(cwd, '.claude');
  if (!await fs.pathExists(claudeDir)) {
    return { added: 0, skipped: 0, missingTemplates: [] };
  }

  const settingsPath = path.join(claudeDir, 'settings.json');
  const settingsLocalPath = path.join(claudeDir, 'settings.local.json');

  const settings = await readJsonIfExists(settingsPath) || {};
  const settingsLocal = await readJsonIfExists(settingsLocalPath);

  if (await fs.pathExists(settingsLocalPath) && settingsLocal === null) {
    return { added: 0, skipped: 0, missingTemplates: [], error: 'settings.local.json 解析失败，已跳过自动配置' };
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

  let added = 0;
  let skipped = 0;
  const missingTemplates = [];

  for (const pluginId of corePluginIds) {
    const plugin = registry.plugins.find(p => p && p.id === pluginId);
    const isMcp = plugin && plugin.integration && plugin.integration.type === 'mcp';
    if (!plugin || !isMcp) continue;

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
      skipped += 1;
      continue;
    }

    const template = plugin.claude && plugin.claude.mcpServer ? plugin.claude.mcpServer : null;
    if (!template) {
      missingTemplates.push(pluginId);
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
      skipped += 1;
      continue;
    }

    const resolved = substituteTemplateDeep(template, { project_root: cwd });
    local.mcpServers = local.mcpServers || {};
    local.mcpServers[serverName] = resolved;
    existingServers.add(serverName);
    added += 1;
  }

  if (added > 0) {
    await fs.writeJson(settingsLocalPath, local, { spaces: 2 });
  }

  return { added, skipped, missingTemplates };
}

module.exports = {
  loadPluginRegistry,
  getCorePluginIdsFromRegistry,
  getCorePluginIdsFromProject,
  configureClaudeCoreTools
};
