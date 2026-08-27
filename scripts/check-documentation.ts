import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const outputPath = path.join(rootDir, '.ai', 'documentation-context.md');

const EXCLUDED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.turbo',
  '.idea',
  '.vscode',
  'vendor',
  'tmp',
  '.cache',
  '__pycache__',
  '.venv',
  'generated',
]);

const DOCUMENTATION_DIRECTORIES = ['docs', '.github', '.ai'];
const DOCUMENTATION_FILES = [
  'README.md',
  'AGENTS.md',
  'AI.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  'SECURITY.md',
];

const RELEVANT_CONFIG_FILES = [
  'package.json',
  'package-lock.json',
  'backend/package.json',
  'frontend/package.json',
  'backend/tsconfig.json',
  'backend/tsconfig.build.json',
  'frontend/tsconfig.json',
  'frontend/tsconfig.app.json',
  'frontend/tsconfig.node.json',
  'backend/drizzle.config.ts',
  'drizzle.config.ts',
  'frontend/vite.config.ts',
  'backend/eslint.config.mjs',
  'frontend/eslint.config.js',
  'docker-compose.yml',
  'docker-compose.yaml',
  '.gitignore',
  '.env.example',
  '.github/workflows/ci.yml',
  '.github/workflows/documentation.yml',
];

function safeReadFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function runCommand(command: string, args: string[]): string {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: 'utf8',
    env: process.env,
  });

  if (result.status === 0 && result.stdout) {
    return result.stdout.trim();
  }

  return 'Unavailable';
}

function isExcludedDirectory(relativePath: string): boolean {
  const normalized = relativePath.split(path.sep).join('/');
  const segments = normalized.split('/');

  return segments.some((segment) => EXCLUDED_DIRECTORIES.has(segment));
}

function addMarkdownFilesFromDirectory(directory: string, results: Set<string>): void {
  const absoluteDirectory = path.join(rootDir, directory);
  if (!fs.existsSync(absoluteDirectory) || !fs.statSync(absoluteDirectory).isDirectory()) {
    return;
  }

  const entries = fs.readdirSync(absoluteDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(absoluteDirectory, entry.name);
    const relativePath = path.posix.join(directory, entry.name).split(path.sep).join('/');

    if (entry.isDirectory()) {
      if (isExcludedDirectory(relativePath) || relativePath === '.ai/documentation-context.md') {
        continue;
      }
      addMarkdownFilesFromDirectory(relativePath, results);
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md') && relativePath !== '.ai/documentation-context.md') {
      results.add(relativePath);
    }
  }
}

function collectMarkdownFiles(): string[] {
  const markdownFiles = new Set<string>();

  for (const fileName of DOCUMENTATION_FILES) {
    const absolutePath = path.join(rootDir, fileName);
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
      markdownFiles.add(fileName);
    }
  }

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || EXCLUDED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const directoryName = entry.name;
    const readmePath = path.join(rootDir, directoryName, 'README.md');
    const aiPath = path.join(rootDir, directoryName, 'AI.md');

    if (fs.existsSync(readmePath) && fs.statSync(readmePath).isFile()) {
      markdownFiles.add(path.posix.join(directoryName, 'README.md'));
    }

    if (fs.existsSync(aiPath) && fs.statSync(aiPath).isFile()) {
      markdownFiles.add(path.posix.join(directoryName, 'AI.md'));
    }
  }

  for (const directory of DOCUMENTATION_DIRECTORIES) {
    addMarkdownFilesFromDirectory(directory, markdownFiles);
  }

  return Array.from(markdownFiles).sort((left, right) => left.localeCompare(right));
}

function getPackageJsonScripts(packagePath: string): Record<string, string> {
  const rawValue = safeReadFile(packagePath);
  if (!rawValue) {
    return {};
  }

  const parsed = safeJsonParse<{ scripts?: Record<string, string> }>(rawValue);
  return parsed?.scripts ?? {};
}

function collectRelevantConfigFiles(): string[] {
  return RELEVANT_CONFIG_FILES.filter((relativePath) => {
    const absolutePath = path.join(rootDir, relativePath);
    return fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile();
  });
}

function summarizeGitStatus(): string {
  const status = runCommand('git', ['status', '--short', '--untracked-files=normal']);
  return status === 'Unavailable' ? 'Git status unavailable.' : status;
}

function summarizeRecentCommits(): string {
  const commits = runCommand('git', ['log', '-n', '10', '--oneline', '--decorate']);
  return commits === 'Unavailable' ? 'Recent commits unavailable.' : commits;
}

function summarizeRecentChanges(): string {
  const diffNameStatus = runCommand('git', ['diff', '--name-status']);
  const diffStat = runCommand('git', ['diff', '--stat']);

  return [
    'Changed files in working tree:',
    diffNameStatus === 'Unavailable' ? 'Git diff unavailable.' : diffNameStatus || 'No working-tree changes.',
    '',
    'Working tree diff stat:',
    diffStat === 'Unavailable' ? 'Git diff stat unavailable.' : diffStat || 'No diff stat available.',
  ].join('\n');
}

function summarizeRecentCommitsFiles(): string {
  const output = runCommand('git', ['log', '-n', '10', '--name-status', '--pretty=format:%h %s']);
  return output === 'Unavailable' ? 'Recent commit file history unavailable.' : output;
}

function getCurrentBranch(): string {
  return runCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
}

function buildTreeSummary(): string {
  const lines: string[] = ['.'];

  const topLevelEntries = ['.ai', '.github', 'backend', 'docs', 'frontend', 'scripts'];

  for (const entry of topLevelEntries) {
    const absolutePath = path.join(rootDir, entry);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isDirectory()) {
      continue;
    }

    if (entry === '.ai') {
      lines.push('├── .ai/');
      const promptPath = path.join(absolutePath, 'prompts');
      if (fs.existsSync(promptPath) && fs.statSync(promptPath).isDirectory()) {
        lines.push('│   └── prompts/');
      }
      continue;
    }

    if (entry === '.github') {
      lines.push('├── .github/');
      const workflowsPath = path.join(absolutePath, 'workflows');
      if (fs.existsSync(workflowsPath) && fs.statSync(workflowsPath).isDirectory()) {
        lines.push('│   └── workflows/');
      }
      continue;
    }

    if (entry === 'backend') {
      lines.push('├── backend/');
      if (fs.existsSync(path.join(absolutePath, 'src'))) {
        lines.push('│   ├── src/');
      }
      if (fs.existsSync(path.join(absolutePath, 'test'))) {
        lines.push('│   ├── test/');
      }
      if (fs.existsSync(path.join(absolutePath, 'drizzle'))) {
        lines.push('│   ├── drizzle/');
      }
      if (fs.existsSync(path.join(absolutePath, 'README.md'))) {
        lines.push('│   └── README.md');
      }
      continue;
    }

    if (entry === 'frontend') {
      lines.push('├── frontend/');
      if (fs.existsSync(path.join(absolutePath, 'src'))) {
        lines.push('│   ├── src/');
      }
      if (fs.existsSync(path.join(absolutePath, 'README.md'))) {
        lines.push('│   └── README.md');
      }
      continue;
    }

    if (entry === 'docs') {
      lines.push('├── docs/');
      continue;
    }

    if (entry === 'scripts') {
      lines.push('├── scripts/');
    }
  }

  if (fs.existsSync(path.join(rootDir, 'README.md'))) {
    lines.push('├── README.md');
  }

  if (fs.existsSync(path.join(rootDir, 'AGENTS.md'))) {
    lines.push('├── AGENTS.md');
  }

  if (fs.existsSync(path.join(rootDir, 'AI.md'))) {
    lines.push('├── AI.md');
  }

  if (fs.existsSync(path.join(rootDir, 'package.json'))) {
    lines.push('├── package.json');
  }

  if (fs.existsSync(path.join(rootDir, 'docker-compose.yml'))) {
    lines.push('├── docker-compose.yml');
  }

  if (fs.existsSync(path.join(rootDir, '.gitignore'))) {
    lines.push('├── .gitignore');
  }

  return lines.join('\n');
}

function gatherPackageContext(): Array<{ name: string; scripts: Record<string, string> }> {
  const packageFiles = ['package.json', 'frontend/package.json', 'backend/package.json'];

  return packageFiles
    .filter((relativePath) => fs.existsSync(path.join(rootDir, relativePath)))
    .map((relativePath) => ({
      name: relativePath,
      scripts: getPackageJsonScripts(path.join(rootDir, relativePath)),
    }))
    .filter((entry) => Object.keys(entry.scripts).length > 0)
    .sort((left, right) => left.name.localeCompare(right.name));
}

function main(): void {
  const markdownFiles = collectMarkdownFiles();
  const configFiles = collectRelevantConfigFiles();
  const packageContext = gatherPackageContext();
  const structure = buildTreeSummary();

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const content = [
    '# Documentation Maintenance Context',
    '',
    '> This file is generated by the repository documentation check. It is not meant to be manually edited.',
    '',
    '## Repository state',
    '',
    `- Current branch: ${getCurrentBranch()}`,
    '',
    '### Git status',
    '```text',
    summarizeGitStatus(),
    '```',
    '',
    '### Recent commits',
    '```text',
    summarizeRecentCommits(),
    '```',
    '',
    '### Recent changed files',
    '```text',
    summarizeRecentChanges(),
    '```',
    '',
    '### Recent commit file history',
    '```text',
    summarizeRecentCommitsFiles(),
    '```',
    '',
    '## Project structure',
    '',
    '```text',
    structure,
    '```',
    '',
    '## Relevant configuration',
    '',
    `Configuration files analyzed: ${configFiles.length}`,
    '',
    ...configFiles.map((relativePath) => {
      const absolutePath = path.join(rootDir, relativePath);
      const fileContent = safeReadFile(absolutePath) ?? 'File could not be read.';
      return [`### ${relativePath}`, '', '```', fileContent, '```', ''].join('\n');
    }),
    '## Documentation files',
    '',
    `Markdown files analyzed: ${markdownFiles.length}`,
    '',
    ...markdownFiles.map((relativePath) => {
      const absolutePath = path.join(rootDir, relativePath);
      const contentValue = safeReadFile(absolutePath) ?? 'File could not be read.';
      return [`### ${relativePath}`, '', '```md', contentValue, '```', ''].join('\n');
    }),
    '## Project scripts',
    '',
    ...packageContext.flatMap((entry) => {
      const scriptBlock = JSON.stringify(entry.scripts, null, 2);
      return [`### ${entry.name}`, '', '```json', scriptBlock, '```', ''].join('\n');
    }),
    '',
    '## Notes',
    '',
    '- This context is generated for focused documentation maintenance and review.',
    '- Source code should be inspected directly when implementation detail is required.',
    '- Generated context intentionally excludes dependency and generated artifacts.',
    '',
  ].join('\n');

  fs.writeFileSync(outputPath, content, 'utf8');

  const recentCommitCount = summarizeRecentCommits().split('\n').length;

  console.log('Documentation context generated successfully.');
  console.log('');
  console.log(`Markdown files analyzed: ${markdownFiles.length}`);
  console.log(`Configuration files analyzed: ${configFiles.length}`);
  console.log(`Recent commits analyzed: ${recentCommitCount}`);
  console.log('');
  console.log('Output:');
  console.log('.ai/documentation-context.md');
}

main();
