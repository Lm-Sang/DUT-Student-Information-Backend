import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { test } from 'node:test';
import { javascriptFiles, projectRoot } from '../../scripts/lib/files.js';

const sourceRoot = join(projectRoot, 'src');
const partsOf = file => relative(sourceRoot, file).split(sep);
function owner(parts) {
  if (parts[0] === 'common') return { area: 'common', feature: parts[1] };
  if (['student', 'admin', 'public'].includes(parts[0])) {
    return { area: parts[0], feature: parts[1] === 'modules' ? parts[2] : undefined };
  }
  return undefined;
}
function imports(file) {
  return [...readFileSync(file, 'utf8').matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)(['"])([^'"]+)\1/g)]
    .map(match => match[2]).filter(specifier => specifier.startsWith('.') && !specifier.includes('${'));
}

test('frontend areas are independent and common never depends on frontend or bootstrap code', () => {
  const violations = [];
  for (const file of javascriptFiles(sourceRoot)) {
    const source = partsOf(file), from = owner(source);
    for (const specifier of imports(file)) {
      const target = partsOf(resolve(dirname(file), specifier)), to = owner(target);
      const infrastructure = ['shared', 'config', 'infrastructure'].includes(source[0]);
      const backwards = infrastructure && (to || ['bootstrap', 'development', 'app.js', 'server.js'].includes(target[0]));
      const commonToFrontend = from?.area === 'common' && ['student', 'admin', 'public', 'bootstrap', 'development'].includes(target[0]);
      const crossesFrontend = from && ['student', 'admin', 'public'].includes(from.area)
        && ['student', 'admin', 'public'].includes(to?.area) && from.area !== to.area;
      const importsComposition = from && ['bootstrap', 'app.js', 'server.js'].includes(target[0]);
      const crossesFeatureInternals = from && to && from.feature !== to.feature && target.at(-1) !== 'index.js';
      if (backwards || commonToFrontend || crossesFrontend || importsComposition || crossesFeatureInternals) {
        violations.push(relative(projectRoot, file) + ' -> ' + specifier);
      }
    }
  }
  assert.deepEqual(violations, [], 'Keep role modules independent and use module facades across business features.');
});

test('DTOs, mappers and rules stay pure; services and repositories do not import HTTP layers', () => {
  const forbidden = {
    controllers: ['repositories', 'infrastructure'],
    routes: ['repositories', 'infrastructure'],
    services: ['controllers', 'routes'],
    repositories: ['controllers', 'routes', 'services'],
    dto: ['controllers', 'routes', 'services', 'repositories', 'infrastructure'],
    mappers: ['controllers', 'routes', 'services', 'repositories', 'infrastructure'],
    rules: ['controllers', 'routes', 'services', 'repositories', 'infrastructure'],
  };
  const violations = [];
  for (const file of javascriptFiles(sourceRoot)) {
    const source = partsOf(file), layer = source.find(part => part in forbidden);
    if (!layer) continue;
    const sourceText = readFileSync(file, 'utf8');
    for (const match of sourceText.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)(['"])([^'"]+)\1/g)) {
      const specifier = match[2];
      const target = specifier.startsWith('.') ? partsOf(resolve(dirname(file), specifier)) : [specifier];
      const driver = ['mssql', 'msnodesqlv8', 'ssh2', 'node:sqlite'].some(name => specifier === name || specifier.startsWith(name + '/'));
      if (target.some(part => forbidden[layer].includes(part))
        || (driver && layer !== 'repositories')
        || (specifier === 'express' && ['dto', 'mappers', 'rules', 'services', 'repositories'].includes(layer))) {
        violations.push(relative(projectRoot, file) + ' -> ' + specifier);
      }
    }
  }
  assert.deepEqual(violations, []);
});

test('all relative source, CLI and test imports resolve after relocation', () => {
  const missing = [];
  for (const folder of ['src', 'scripts', 'tests']) {
    for (const file of javascriptFiles(join(projectRoot, folder))) {
      for (const specifier of imports(file)) {
        if (!existsSync(resolve(dirname(file), specifier))) missing.push(relative(projectRoot, file) + ' -> ' + specifier);
      }
    }
  }
  assert.deepEqual(missing, []);
});

test('application source contains no tests, CLI commands or old domain folders', () => {
  const misplaced = javascriptFiles(sourceRoot).filter(file => {
    const parts = partsOf(file);
    return file.endsWith('.test.js') || parts.some(part => ['__tests__', 'cli', 'domain'].includes(part));
  });
  assert.deepEqual(misplaced, []);
});
