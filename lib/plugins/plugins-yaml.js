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

module.exports = {
  stripYamlComment,
  parsePluginListsFromYaml
};
