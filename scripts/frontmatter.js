import YAML from 'yaml';

const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

export default function frontmatter(source) {
  const value = String(source ?? '');
  const match = value.match(frontmatterPattern);
  if (!match) return { data: {}, content: value };

  const data = YAML.parse(match[1]) ?? {};
  return {
    data: typeof data === 'object' && data !== null && !Array.isArray(data) ? data : {},
    content: value.slice(match[0].length),
  };
}

frontmatter.stringify = function stringify(content, data = {}) {
  const yaml = YAML.stringify(data, { lineWidth: 0 }).trimEnd();
  return `---\n${yaml}\n---\n${String(content ?? '').replace(/^\r?\n/, '')}`;
};
