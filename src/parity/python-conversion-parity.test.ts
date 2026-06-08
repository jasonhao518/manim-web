import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import * as manim from '@/index';

type MetricObject = {
  type: string;
  center: [number | null, number | null];
  size: [number | null, number | null];
  bounds: { min: [number | null, number | null]; max: [number | null, number | null] };
  style: {
    color: string | null;
    fill_color: string | null;
    stroke_color: string | null;
    fill_opacity: number | null;
    stroke_opacity: number | null;
    stroke_width: number | null;
  };
};

type ProbePayload = {
  source: string;
  scene: string;
  objects: MetricObject[];
};

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const VENDOR_ROOT = resolve(THIS_DIR, '../..');

type ParityCase = {
  id: string;
  sceneFile: string;
  sceneClass: string;
};

const PARITY_CASES: ParityCase[] = [
  {
    id: 'basic-scene',
    sceneFile: resolve(THIS_DIR, './fixtures/basic_scene.py'),
    sceneClass: 'ParityBasicScene',
  },
  {
    id: 'geometry-components',
    sceneFile: resolve(THIS_DIR, './fixtures/geometry_components_scene.py'),
    sceneClass: 'ParityGeometryComponentsScene',
  },
  {
    id: 'grammar-patterns',
    sceneFile: resolve(THIS_DIR, './fixtures/grammar_patterns_scene.py'),
    sceneClass: 'ParityGrammarPatternsScene',
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

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asXY(value: unknown): [number | null, number | null] {
  if (value && typeof value === 'object') {
    const rec = value as { toArray?: () => unknown; x?: unknown; y?: unknown };
    if (typeof rec.toArray === 'function') {
      return asXY(rec.toArray());
    }
    if (typeof rec.x !== 'undefined' && typeof rec.y !== 'undefined') {
      return [asNumber(rec.x), asNumber(rec.y)];
    }
  }
  if (!Array.isArray(value) || value.length < 2) {
    return [null, null];
  }
  return [asNumber(value[0]), asNumber(value[1])];
}

function normalizeColor(value: unknown): string | null {
  if (value === null || typeof value === 'undefined') {
    return null;
  }
  const text = String(value).trim();
  return text ? text.toLowerCase() : null;
}

function extractWebMetrics(mobj: unknown): MetricObject {
  const mob = mobj as {
    constructor?: { name?: string };
    getCenter?: () => unknown;
    getWidth?: () => unknown;
    getHeight?: () => unknown;
    getBoundingBox?: () => unknown;
    color?: unknown;
    fillColor?: unknown;
    strokeColor?: unknown;
    fillOpacity?: unknown;
    opacity?: unknown;
    strokeWidth?: unknown;
  };

  const box = typeof mob.getBoundingBox === 'function' ? (mob.getBoundingBox() as unknown) : null;
  const boxRec = box as { min?: unknown; max?: unknown } | null;

  return {
    type: typeof mob.constructor?.name === 'string' ? mob.constructor.name : 'Unknown',
    center: typeof mob.getCenter === 'function' ? asXY(mob.getCenter()) : [null, null],
    size: [
      typeof mob.getWidth === 'function' ? asNumber(mob.getWidth()) : null,
      typeof mob.getHeight === 'function' ? asNumber(mob.getHeight()) : null,
    ],
    bounds: {
      min: asXY(boxRec?.min),
      max: asXY(boxRec?.max),
    },
    style: {
      color: normalizeColor(mob.color),
      fill_color: normalizeColor(mob.fillColor),
      stroke_color: normalizeColor(mob.strokeColor),
      fill_opacity: asNumber(mob.fillOpacity),
      stroke_opacity: asNumber(mob.opacity),
      stroke_width: asNumber(mob.strokeWidth),
    },
  };
}

function runPythonProbe(sceneFile: string, sceneClass: string): ProbePayload {
  const pythonScript = [
    'import importlib.util, json, sys',
    'scene_file = sys.argv[1]',
    'scene_class = sys.argv[2]',
    'spec = importlib.util.spec_from_file_location("parity_scene_module", scene_file)',
    'module = importlib.util.module_from_spec(spec)',
    'spec.loader.exec_module(module)',
    'scene_cls = getattr(module, scene_class)',
    'scene = scene_cls()',
    'scene.construct()',
    'def f(v):',
    '  try: return float(v)',
    '  except Exception: return None',
    'def xy(v):',
    '  if hasattr(v, "tolist"): v = v.tolist()',
    '  if not isinstance(v, (list, tuple)) or len(v) < 2: return [None, None]',
    '  return [f(v[0]), f(v[1])]',
    'def c(v):',
    '  if v is None: return None',
    '  try:',
    '    if hasattr(v, "to_hex"): return str(v.to_hex()).lower()',
    '  except Exception:',
    '    pass',
    '  t = str(v).strip().lower()',
    '  return t if t else None',
    'def metric(m):',
    '  try: bbox = m.get_bounding_box()',
    '  except Exception: bbox = None',
    '  if hasattr(bbox, "tolist"): bbox = bbox.tolist()',
    '  bmin, bmax = [None, None], [None, None]',
    '  if isinstance(bbox, list) and len(bbox) > 0:',
    '    try:',
    '      xs = [float(p[0]) for p in bbox]',
    '      ys = [float(p[1]) for p in bbox]',
    '      bmin, bmax = [min(xs), min(ys)], [max(xs), max(ys)]',
    '    except Exception:',
    '      pass',
    '  out = {',
    '    "type": m.__class__.__name__,',
    '    "center": xy(m.get_center()),',
    '    "size": [f(getattr(m, "width", None)), f(getattr(m, "height", None))],',
    '    "bounds": {"min": bmin, "max": bmax},',
    '    "style": {',
    '      "color": c(m.get_color() if hasattr(m, "get_color") else None),',
    '      "fill_color": c(m.get_fill_color() if hasattr(m, "get_fill_color") else None),',
    '      "stroke_color": c(m.get_stroke_color() if hasattr(m, "get_stroke_color") else None),',
    '      "fill_opacity": f(getattr(m, "fill_opacity", None)),',
    '      "stroke_opacity": f(getattr(m, "stroke_opacity", None)),',
    '      "stroke_width": f(getattr(m, "stroke_width", None)),',
    '    }',
    '  }',
    '  return out',
    'payload = {"source": "python-manim", "scene": scene_class, "objects": [metric(m) for m in scene.mobjects]}',
    'print(json.dumps(payload))',
  ].join('\n');

  const result = spawnSync('python3', ['-c', pythonScript, sceneFile, sceneClass], {
    cwd: VENDOR_ROOT,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || 'Python probe failed');
  }

  return JSON.parse(result.stdout) as ProbePayload;
}

async function runManimWebProbe(sceneFile: string): Promise<ProbePayload> {
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

  return {
    source: 'manim-web',
    scene: 'converted',
    objects: Array.from(scene.mobjects).map((mobj) => extractWebMetrics(mobj)),
  };
}

function pythonManimAvailable(): boolean {
  const check = spawnSync('python3', ['-c', 'import manim'], {
    cwd: VENDOR_ROOT,
    encoding: 'utf8',
  });
  return check.status === 0;
}

const parityIt = pythonManimAvailable() ? it : it.skip;

describe('Python-to-manim-web parity', () => {
  parityIt.each(PARITY_CASES)(
    '$id: matches bounds, size, position, and style',
    async (testCase) => {
      const py = runPythonProbe(testCase.sceneFile, testCase.sceneClass);
      const web = await runManimWebProbe(testCase.sceneFile);

      expect(web.objects.length).toBe(py.objects.length);

      for (let index = 0; index < py.objects.length; index += 1) {
        const pyObj = py.objects[index];
        const webObj = web.objects[index];
        const label = `object[${index}]`;

        expect(webObj.center[0]).toBeCloseTo(pyObj.center[0] ?? 0, 1);
        expect(webObj.center[1]).toBeCloseTo(pyObj.center[1] ?? 0, 1);

        expect(webObj.size[0]).toBeCloseTo(pyObj.size[0] ?? 0, 1);
        expect(webObj.size[1]).toBeCloseTo(pyObj.size[1] ?? 0, 1);

        expect(webObj.bounds.min[0], `${label} bounds.min.x`).toBeCloseTo(
          pyObj.bounds.min[0] ?? 0,
          1,
        );
        expect(webObj.bounds.min[1], `${label} bounds.min.y`).toBeCloseTo(
          pyObj.bounds.min[1] ?? 0,
          1,
        );
        expect(webObj.bounds.max[0], `${label} bounds.max.x`).toBeCloseTo(
          pyObj.bounds.max[0] ?? 0,
          1,
        );
        expect(webObj.bounds.max[1], `${label} bounds.max.y`).toBeCloseTo(
          pyObj.bounds.max[1] ?? 0,
          1,
        );

        expect(webObj.style.stroke_width, `${label} stroke_width`).toBeCloseTo(
          pyObj.style.stroke_width ?? 0,
          1,
        );
        expect(webObj.style.fill_opacity, `${label} fill_opacity`).toBeCloseTo(
          pyObj.style.fill_opacity ?? 0,
          1,
        );
        expect(webObj.style.stroke_opacity, `${label} stroke_opacity`).toBeCloseTo(
          pyObj.style.stroke_opacity ?? 0,
          1,
        );

        expect(webObj.style.color, `${label} color`).toBe(pyObj.style.color);
        expect(webObj.style.fill_color, `${label} fill_color`).toBe(pyObj.style.fill_color);
        expect(webObj.style.stroke_color, `${label} stroke_color`).toBe(pyObj.style.stroke_color);
      }
    },
  );
});
