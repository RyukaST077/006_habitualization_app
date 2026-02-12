import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadRepositorySource(relativePath: string): string {
  const absolutePath = resolve(relativePath);

  expect(
    existsSync(absolutePath),
    `Repository contract not implemented: ${relativePath}`,
  ).toBe(true);

  return readFileSync(absolutePath, 'utf8');
}

export function expectRepositoryMethods(
  sourceCode: string,
  repositoryName: string,
  methods: string[],
): void {
  for (const method of methods) {
    expect(
      sourceCode.includes(`${method}(`),
      `${repositoryName}.${method} is required by contract`,
    ).toBe(true);
  }
}

export function expectErrorContract(sourceCode: string, errors: string[]): void {
  for (const errorCode of errors) {
    expect(sourceCode, `Expected error contract: ${errorCode}`).toContain(errorCode);
  }
}

