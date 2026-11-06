import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { test } from 'node:test';

import { javascriptFiles, projectRoot } from '../scripts/lib/files.js';

test('features expose index.js to each other; shared infrastructure has no business dependencies', () => {
  const sourceRoot = join(projectRoot, 'src');
  const violations = [];
  for (const file of javascriptFiles(sourceRoot)) {
    const source = relative(sourceRoot, file).split(sep);
    if (source.includes('__tests__')) continue;
    const feature = source[0] === 'modules' && source.length > 2 ? source[1] : undefined;
    const common = ['shared', 'config', 'infrastructure'].includes(source[0]);
    // Covers the project's literal import/export-from and dynamic import forms.
    const imports = readFileSync(file, 'utf8').matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)(['"])([^'"]+)\1/g);
    for (const [, , specifier] of imports) {
      if (!specifier.startsWith('.')) continue;
      const target = relative(sourceRoot, resolve(dirname(file), specifier)).split(sep);
      const targetsModule = target[0] === 'modules';
      const targetsApplication = ['app.js', 'server.js'].includes(target[0]);
      const crossesFeature = feature && targetsModule && target[1] !== feature;
      const publicEntry = target.length === 3 && target[2] === 'index.js';
      if ((common && (targetsModule || targetsApplication))
        || (feature && targetsApplication)
        || (crossesFeature && !publicEntry)) {
        violations.push(`${relative(projectRoot, file)} -> ${specifier}`);
      }
    }
  }
  assert.deepEqual(violations, [], 'Use feature index.js exports and keep shared code independent of business features.');
});

test('DTOs and mappers stay pure; repositories and services do not depend on HTTP controllers', () => {
  const sourceRoot = join(projectRoot, 'src');
  const layers = ['controllers', 'routes', 'services', 'repositories', 'dto', 'mappers'];
  const forbidden = {
    controllers: ['repositories', 'infrastructure'],
    routes: ['repositories', 'infrastructure'],
    services: ['controllers', 'routes'],
    repositories: ['controllers', 'routes', 'services'],
    dto: ['controllers', 'routes', 'services', 'repositories', 'infrastructure'],
    mappers: ['controllers', 'routes', 'services', 'repositories', 'infrastructure'],
  };
  const violations = [];
  for (const file of javascriptFiles(sourceRoot)) {
    const source = relative(sourceRoot, file).split(sep);
    if (source.includes('__tests__')) continue;
    const layer = source.find((segment) => layers.includes(segment));
    if (!layer) continue; // Entry points and composition factories wire all layers.
    const imports = readFileSync(file, 'utf8').matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)(['"])([^'"]+)\1/g);
    for (const [, , specifier] of imports) {
      const target = specifier.startsWith('.')
        ? relative(sourceRoot, resolve(dirname(file), specifier)).split(sep)
        : [specifier];
      const importsForbiddenLayer = target.some((segment) => forbidden[layer].includes(segment));
      const importsDatabaseDriver = ['mssql', 'msnodesqlv8', 'ssh2', 'node:sqlite']
        .some((driver) => specifier === driver || specifier.startsWith(`${driver}/`));
      const importsHttpFramework = specifier === 'express';
      if (importsForbiddenLayer
        || (importsDatabaseDriver && layer !== 'repositories')
        || (importsHttpFramework && ['dto', 'mappers', 'services', 'repositories'].includes(layer))) {
        violations.push(`${relative(projectRoot, file)} -> ${specifier}`);
      }
    }
  }
  assert.deepEqual(violations, [], 'Keep request parsing, mapping, business rules and database access in their own layers.');
});
