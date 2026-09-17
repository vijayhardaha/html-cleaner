import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';

import { describe, expect, it, vi } from 'vitest';

import { createProcessEnvironment, runCli } from '../../src/cli/index';
import type { CliEnvironment } from '../../src/cli/index';

/**
 * Capture stdout and stderr into arrays with a fixed stdin payload.
 *
 * @param {string} stdinText - Text returned by the mocked stdin reader.
 *
 * @returns {CliEnvironment & { out: string[]; err: string[] }} Environment recording stdout and stderr.
 */
function createTestEnvironment(stdinText = ''): CliEnvironment & { out: string[]; err: string[] } {
  const out: string[] = [];
  const err: string[] = [];

  return {
    out,
    err,
    stdout: (text) => {
      out.push(text);
    },
    stderr: (text) => {
      err.push(text);
    },
    readStdin: async () => stdinText,
  };
}

describe('runCli end-to-end', () => {
  it('cleans a file to stdout', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'html-cleaner-cli-'));
    const inputPath = join(directory, 'input.html');

    await writeFile(inputPath, '<p class="x">Hi</p>\n', 'utf8');

    try {
      const environment = createTestEnvironment();
      const code = await runCli([inputPath, '--remove-classes'], environment);

      expect(code).toBe(0);
      expect(environment.out.join('')).toBe('<p>Hi</p>\n');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('writes a file to --output', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'html-cleaner-cli-'));
    const inputPath = join(directory, 'input.html');
    const outputPath = join(directory, 'output.html');

    await writeFile(inputPath, '<!--c--><p>a</p>\n', 'utf8');

    try {
      const environment = createTestEnvironment();
      const code = await runCli([inputPath, '--output', outputPath], environment);

      expect(code).toBe(0);
      await expect(readFile(outputPath, 'utf8')).resolves.toBe('<p>a</p>\n');
      expect(environment.out).toEqual([]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('modifies the input file with --write', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'html-cleaner-cli-'));
    const inputPath = join(directory, 'in-place.html');

    await writeFile(inputPath, '<p><b>bold</b></p>\n', 'utf8');

    try {
      const environment = createTestEnvironment();
      const code = await runCli([inputPath, '--write'], environment);

      expect(code).toBe(0);
      await expect(readFile(inputPath, 'utf8')).resolves.toBe('<p><strong>bold</strong></p>\n');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('reads stdin and writes stdout by default', async () => {
    const environment = createTestEnvironment('<p><i>em</i></p>\n');
    const code = await runCli([], environment);

    expect(code).toBe(0);
    expect(environment.out.join('')).toBe('<p><em>em</em></p>\n');
  });

  it('applies a preset', async () => {
    const environment = createTestEnvironment('<p class="x"><b>hi</b></p>\n');
    const code = await runCli(['--preset', 'clean'], environment);

    expect(code).toBe(0);
    expect(environment.out.join('')).toBe('<p><strong>hi</strong></p>\n');
  });

  it('exits with code 2 for invalid arguments', async () => {
    const environment = createTestEnvironment();
    const code = await runCli(['--preset', 'bogus'], environment);

    expect(code).toBe(2);
    expect(environment.err.join('')).toContain('html-cleaner:');
  });

  it('exits with code 1 for a missing input file', async () => {
    const missing = join(tmpdir(), 'html-cleaner-missing-input.html');
    const environment = createTestEnvironment();
    const code = await runCli([missing], environment);

    expect(code).toBe(1);
    expect(environment.err.join('')).toContain('Unable to read input file');
  });

  it('prints --version and exits 0', async () => {
    const environment = createTestEnvironment();
    const code = await runCli(['--version'], environment);

    expect(code).toBe(0);
  });

  it('prints --help and exits 0', async () => {
    const environment = createTestEnvironment();
    const code = await runCli(['--help'], environment);

    expect(code).toBe(0);
  });

  it('refuses --write with --output', async () => {
    const environment = createTestEnvironment();
    const code = await runCli(['in.html', '--write', '--output', 'out.html'], environment);

    expect(code).toBe(2);
    expect(environment.err.join('')).toContain('--write and --output cannot be combined');
  });

  it('refuses --stdout with --output', async () => {
    const environment = createTestEnvironment();
    const code = await runCli(['in.html', '--stdout', '--output', 'out.html'], environment);

    expect(code).toBe(2);
    expect(environment.err.join('')).toContain('--stdout and --output cannot be combined');
  });

  it('refuses --write without an input file', async () => {
    const environment = createTestEnvironment();
    const code = await runCli(['--write'], environment);

    expect(code).toBe(2);
    expect(environment.err.join('')).toContain('--write requires an input file');
  });

  it('refuses --write with --stdin', async () => {
    const environment = createTestEnvironment();
    const code = await runCli(['in.html', '--write', '--stdin'], environment);

    expect(code).toBe(2);
    expect(environment.err.join('')).toContain('--write cannot be combined with --stdin');
  });

  it('loads options from a --config file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'html-cleaner-config-'));
    const configPath = join(directory, 'cleaner.config.json');

    await writeFile(configPath, JSON.stringify({ removeClasses: true }), 'utf8');

    try {
      const environment = createTestEnvironment('<p class="x">hi</p>\n');
      const code = await runCli(['--config', configPath], environment);

      expect(code).toBe(0);
      expect(environment.out.join('')).toBe('<p>hi</p>\n');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

describe('createProcessEnvironment', () => {
  it('writes to the real stdout and stderr', () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    try {
      const environment = createProcessEnvironment();

      environment.stdout('to stdout');
      environment.stderr('to stderr');

      expect(stdout).toHaveBeenCalledWith('to stdout');
      expect(stderr).toHaveBeenCalledWith('to stderr');
    } finally {
      stdout.mockRestore();
      stderr.mockRestore();
    }
  });

  it('reads the real stdin', async () => {
    const stdin = vi.spyOn(process, 'stdin', 'get').mockReturnValue(Readable.from(['<p>', 'from stdin</p>']) as never);

    try {
      const environment = createProcessEnvironment();

      await expect(environment.readStdin()).resolves.toBe('<p>from stdin</p>');
    } finally {
      stdin.mockRestore();
    }
  });
});

describe('runCli --check', () => {
  it('exits 4 when cleaning would change the input', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'html-cleaner-check-'));
    const inputPath = join(directory, 'dirty.html');

    await writeFile(inputPath, '<!--c--><p>hi</p>\n', 'utf8');

    try {
      const environment = createTestEnvironment();
      const code = await runCli([inputPath, '--check'], environment);

      expect(code).toBe(4);
      expect(environment.out.join('')).toBe('');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('exits 0 when the input is already clean', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'html-cleaner-check-'));
    const inputPath = join(directory, 'clean.html');
    const alreadyClean = '<p>hi</p>\n';

    await writeFile(inputPath, alreadyClean, 'utf8');

    try {
      const environment = createTestEnvironment();
      const code = await runCli([inputPath, '--check'], environment);

      expect(code).toBe(0);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('does not write files in check mode', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'html-cleaner-check-'));
    const inputPath = join(directory, 'checked.html');
    const original = '<p class="x">hi</p>\n';

    await writeFile(inputPath, original, 'utf8');

    try {
      const environment = createTestEnvironment();
      await runCli([inputPath, '--check'], environment);

      await expect(readFile(inputPath, 'utf8')).resolves.toBe(original);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

describe('runCli --report', () => {
  it('prints the report to stderr while keeping stdout clean', async () => {
    const environment = createTestEnvironment('<!--note--><p><b>x</b></p>\n');
    const code = await runCli(['--report'], environment);

    expect(code).toBe(0);
    expect(environment.out.join('')).toContain('<p><strong>x</strong></p>');
    expect(environment.err.join('')).toContain('html-cleaner report');
    expect(environment.err.join('')).toContain('comments removed: 1');
  });
});
