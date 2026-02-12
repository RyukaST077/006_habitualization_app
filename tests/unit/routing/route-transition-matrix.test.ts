import { describe, expect, it } from 'vitest';
import {
  HOME_TRANSITION_LINKS,
  POLICY_CONSENT_TRANSITION,
  resolveNormalTransitionPath,
} from '../../../src/client/routing/transition-map';
import {
  createRouteTransitionMatrix,
  createScreenContainerFixtures,
} from '../../helpers/fixtures';
import { readSourceFile } from '../../helpers/ui/common-ui-assertions';

const routeTransitionMatrix = createRouteTransitionMatrix();
const screenContainerFiles = createScreenContainerFixtures();

const normalTransitionCases = routeTransitionMatrix.filter(
  (testCase) =>
    (testCase.fromScr === 'SCR-002' &&
      ['SCR-003', 'SCR-004', 'SCR-005', 'SCR-006', 'SCR-007'].includes(testCase.toScr)) ||
    (testCase.fromScr === 'SCR-008' && testCase.toScr === 'SCR-002'),
);

describe('route transition matrix', () => {
  it('covers SCR-001..008 at least once in source/destination', () => {
    const covered = new Set(
      routeTransitionMatrix.flatMap((testCase) => [testCase.fromScr, testCase.toScr]),
    );

    expect(covered).toEqual(
      new Set([
        'SCR-001',
        'SCR-002',
        'SCR-003',
        'SCR-004',
        'SCR-005',
        'SCR-006',
        'SCR-007',
        'SCR-008',
      ]),
    );
  });

  it('contains observable assertions for transition source/destination', () => {
    for (const testCase of routeTransitionMatrix) {
      expect(testCase.fromPath).toMatch(/^\//);
      expect(testCase.expectedPath).toMatch(/^\//);
      expect(testCase.fromScr).not.toBe('');
      expect(testCase.toScr).not.toBe('');
    }
  });

  it('contains unauthenticated, without-consent, with-consent states', () => {
    const states = new Set(routeTransitionMatrix.map((testCase) => testCase.authState));
    expect(states).toEqual(
      new Set([
        'unauthenticated',
        'authenticated_without_consent',
        'authenticated_with_consent',
      ]),
    );
  });

  it('keeps SCR/FNC traceability per case', () => {
    for (const testCase of routeTransitionMatrix) {
      expect(testCase.traceability.some((tag) => /^SCR-\d{3}$/.test(tag))).toBe(true);
      expect(testCase.traceability.some((tag) => /^FNC-\d{3}$/.test(tag))).toBe(true);
    }
  });

  it('resolves normal transitions by transition-map (without guard logic)', () => {
    expect(
      resolveNormalTransitionPath({
        from: 'SCR-002',
        to: 'SCR-003',
      }),
    ).toBe('/habits/new');
    expect(
      resolveNormalTransitionPath({
        from: 'SCR-002',
        to: 'SCR-004',
        params: { habitId: 'abc123' },
      }),
    ).toBe('/habits/abc123/edit');
    expect(
      resolveNormalTransitionPath({
        from: 'SCR-002',
        to: 'SCR-005',
      }),
    ).toBe('/history');
    expect(
      resolveNormalTransitionPath({
        from: 'SCR-002',
        to: 'SCR-006',
      }),
    ).toBe('/analytics');
    expect(
      resolveNormalTransitionPath({
        from: 'SCR-002',
        to: 'SCR-007',
      }),
    ).toBe('/settings');
    expect(
      resolveNormalTransitionPath({
        from: 'SCR-008',
        to: 'SCR-002',
      }),
    ).toBe('/home');
  });

  it('keeps matrix expected paths for normal transitions', () => {
    for (const testCase of normalTransitionCases) {
      if (testCase.fromScr === 'SCR-002' && testCase.toScr === 'SCR-004') {
        expect(
          resolveNormalTransitionPath({
            from: 'SCR-002',
            to: 'SCR-004',
            params: { habitId: 'abc123' },
          }),
        ).toBe(testCase.expectedPath);
        continue;
      }

      if (testCase.fromScr === 'SCR-002' && testCase.toScr === 'SCR-003') {
        expect(resolveNormalTransitionPath({ from: 'SCR-002', to: 'SCR-003' })).toBe(
          testCase.expectedPath,
        );
        continue;
      }

      if (testCase.fromScr === 'SCR-002' && testCase.toScr === 'SCR-005') {
        expect(resolveNormalTransitionPath({ from: 'SCR-002', to: 'SCR-005' })).toBe(
          testCase.expectedPath,
        );
        continue;
      }

      if (testCase.fromScr === 'SCR-002' && testCase.toScr === 'SCR-006') {
        expect(resolveNormalTransitionPath({ from: 'SCR-002', to: 'SCR-006' })).toBe(
          testCase.expectedPath,
        );
        continue;
      }

      if (testCase.fromScr === 'SCR-002' && testCase.toScr === 'SCR-007') {
        expect(resolveNormalTransitionPath({ from: 'SCR-002', to: 'SCR-007' })).toBe(
          testCase.expectedPath,
        );
        continue;
      }

      if (testCase.fromScr === 'SCR-008' && testCase.toScr === 'SCR-002') {
        expect(resolveNormalTransitionPath({ from: 'SCR-008', to: 'SCR-002' })).toBe(
          testCase.expectedPath,
        );
      }
    }
  });

  it('screen containers include observable SCR labels', () => {
    for (const file of screenContainerFiles) {
      const fileContent = readSourceFile(file.path);
      expect(fileContent).toContain(file.scrId);
    }
  });

  it('home page shows observable links for SCR-003/004/005/006/007', () => {
    const homePageContent = readSourceFile('src/app/home/page.tsx');
    expect(homePageContent).toContain('HOME_TRANSITION_LINKS.map');
    expect(homePageContent).toContain('<a href={link.href}>{link.label}</a>');

    expect(HOME_TRANSITION_LINKS.map((link) => link.to)).toEqual([
      'SCR-003',
      'SCR-004',
      'SCR-005',
      'SCR-006',
      'SCR-007',
    ]);
    expect(HOME_TRANSITION_LINKS.map((link) => link.href)).toEqual([
      '/habits/new',
      '/habits/abc123/edit',
      '/history',
      '/analytics',
      '/settings',
    ]);
    expect(HOME_TRANSITION_LINKS.find((link) => link.to === 'SCR-006')?.label).toContain(
      '任意機能/モック',
    );
  });

  it('policy consent page includes SCR-008 -> SCR-002 normal transition link', () => {
    const policyConsentPageContent = readSourceFile('src/app/policy-consent/page.tsx');
    expect(policyConsentPageContent).toContain('POLICY_CONSENT_TRANSITION');
    expect(POLICY_CONSENT_TRANSITION.href).toBe('/home');
    expect(POLICY_CONSENT_TRANSITION.label).toContain('SCR-002');
  });

  it('keeps guard responsibility separated for T-013', () => {
    const transitionMapContent = readSourceFile('src/client/routing/transition-map.ts');
    expect(transitionMapContent).toContain('T-013');
  });
});
