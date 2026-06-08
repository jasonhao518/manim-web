import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import * as manim from '@/index';

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const VENDOR_ROOT = resolve(THIS_DIR, '../..');

type SampleCase = {
  id: string;
  sceneFile: string;
  minObjects: number;
};

const SAMPLE_CASES: SampleCase[] = [
  {
    id: 'sample-square-to-circle',
    sceneFile: resolve(THIS_DIR, './fixtures/sample_square_to_circle.py'),
    minObjects: 1,
  },
  {
    id: 'sample-graph-scene',
    sceneFile: resolve(THIS_DIR, './fixtures/sample_graph_scene.py'),
    minObjects: 2,
  },
  {
    id: 'sample-text-layout-scene',
    sceneFile: resolve(THIS_DIR, './fixtures/sample_text_layout_scene.py'),
    minObjects: 3,
  },
  {
    id: 'sample-transforms-scene',
    sceneFile: resolve(THIS_DIR, './fixtures/sample_transforms_scene.py'),
    minObjects: 1,
  },
  {
    id: 'sample-graphing-variants-scene',
    sceneFile: resolve(THIS_DIR, './fixtures/sample_graphing_variants_scene.py'),
    minObjects: 3,
  },
  {
    id: 'sample-3d-scene',
    sceneFile: resolve(THIS_DIR, './fixtures/sample_3d_scene.py'),
    minObjects: 2,
  },
];

function findMatchingBrace(source: string, openBraceIndex: number): number {
  let depth = 0;
  let inString = false;
  let quote = '';
  let escaped = false;

  for (let index = openBraceIndex; index < source.length; index += 1) {
    const ch = source[index];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === quote) {
        inString = false;
        quote = '';
      }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      quote = ch;
      continue;
    }

    if (ch === '{') {
      depth += 1;
      continue;
    }

    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function extractConstructBody(converted: string): string {
  const fnMatch = converted.match(
    /export\s+async\s+function\s+\w+\s*\([^)]*\)\s*\{|async\s+function\s+\w+\s*\([^)]*\)\s*\{/,
  );
  if (!fnMatch || fnMatch.index === undefined) {
    throw new Error('Could not find async function in py2ts output');
  }

  const openBrace = converted.indexOf('{', fnMatch.index);
  if (openBrace === -1) {
    throw new Error('Malformed py2ts output: missing opening brace');
  }

  const closeBrace = findMatchingBrace(converted, openBrace);
  if (closeBrace === -1) {
    throw new Error('Malformed py2ts output: missing matching closing brace');
  }

  return converted.slice(openBrace + 1, closeBrace).trim();
}

function pythonManimAvailable(): boolean {
  const check = spawnSync('python3', ['-c', 'import manim'], {
    cwd: VENDOR_ROOT,
    encoding: 'utf8',
  });
  return check.status === 0;
}

async function runConvertedSample(sceneFile: string): Promise<number> {
  const sourcePy = readFileSync(sceneFile, 'utf8');
  const converted = execFileSync(process.execPath, ['tools/py2ts.cjs'], {
    cwd: VENDOR_ROOT,
    input: sourcePy,
    encoding: 'utf8',
  }).trim();

  expect(converted.length).toBeGreaterThan(0);

  const body = extractConstructBody(converted);
  const constructSource = `async function construct(scene) {\n${body}\n}`;

  const symbolNames = Object.keys(manim) as Array<keyof typeof manim>;
  const symbolValues = symbolNames.map((name) => manim[name]);
  const construct = new Function(...symbolNames, `${constructSource}; return construct;`)(
    ...symbolValues,
  ) as (scene: manim.Scene) => Promise<void>;

  const scene = manim.Scene.createHeadless();
  await Promise.resolve(construct(scene));
  return scene.mobjects.size;
}

const compatIt = pythonManimAvailable() ? it : it.skip;

describe('Python sample compatibility', () => {
  compatIt.each(SAMPLE_CASES)('$id converts and executes in manim-web', async (sample) => {
    const objectCount = await runConvertedSample(sample.sceneFile);
    expect(objectCount).toBeGreaterThanOrEqual(sample.minObjects);
  });
});
