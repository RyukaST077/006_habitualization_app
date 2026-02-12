import { describe, it } from 'vitest';

import {
  createCommonUiErrorDisplayFixtures,
} from '../../helpers/ui/common-ui-fixtures';
import {
  expectErrorDisplayFixture,
  expectSourceFileExists,
  readSourceFile,
} from '../../helpers/ui/common-ui-assertions';

describe('error display contracts (Red)', () => {
  const targetPath = 'src/components/common/error-display.tsx';
  const fixtures = createCommonUiErrorDisplayFixtures();

  it('SCR-COM-3.2-403: 403は画面上部インライン表示で詳細理由を露出しない', () => {
    if (expectSourceFileExists(targetPath)) {
      const content = readSourceFile(targetPath);
      expectErrorDisplayFixture(content, fixtures.FORBIDDEN_403);
    }
  });

  it('SCR-COM-3.2-409: 409はトースト + 業務導線表示を持つ', () => {
    if (expectSourceFileExists(targetPath)) {
      const content = readSourceFile(targetPath);
      expectErrorDisplayFixture(content, fixtures.DOMAIN_CONFLICT_409);
    }
  });

  it('SCR-COM-3.2-500: 500のみtrace_idを表示し、400/403/409では非表示', () => {
    if (expectSourceFileExists(targetPath)) {
      const content = readSourceFile(targetPath);
      expectErrorDisplayFixture(content, fixtures.INTERNAL_500_TRACE_BOUNDARY);
    }
  });
});
