import YAML from 'yaml';

const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

export default function matter(content) {
  const match = content.match(frontmatterPattern);
  if (!match) {
    return { data: {}, content };
  }

  const data = YAML.parse(match[1]) ?? {};
  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Frontmatter must parse to an object');
  }

  return {
    data,
    content: content.slice(match[0].length),
  };
}

matter.stringify = function stringify(content, data = {}) {
  const yaml = YAML.stringify(data).trimEnd();
  return `---\n${yaml}\n---\n\n${content.replace(/^\r?\n/, '')}`;
};
