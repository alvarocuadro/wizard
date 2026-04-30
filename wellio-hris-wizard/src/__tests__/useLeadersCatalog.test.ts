import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLeadersCatalog } from '../hooks/useLeadersCatalog';
import type { AssignmentItem, TeamCatalogItem } from '../utils/types';

describe('useLeadersCatalog', () => {
  it('auto-selects the leader role when a team has only one unique role', () => {
    const teams: TeamCatalogItem[] = [
      {
        id: 'c-level',
        name: 'C-Level',
        isMain: false,
        leadershipMode: 'own',
        parentIds: ['board'],
        errors: [],
        valid: true,
      },
    ];

    const assignments: AssignmentItem[] = [
      {
        sourceRow: 1,
        member: 'Facundo Brizuela',
        role: 'CEO',
        team: 'C-Level',
        errors: [],
        valid: true,
      },
    ];

    const { result } = renderHook(() => useLeadersCatalog());
    const built = result.current.build(teams, assignments);

    expect(built).toHaveLength(1);
    expect(built[0].leaderRole).toBe('CEO');
    expect(built[0].leaderPersons).toEqual(['Facundo Brizuela']);
    expect(built[0].valid).toBe(true);
  });

  it('does not auto-select a leader role when a team has multiple roles', () => {
    const teams: TeamCatalogItem[] = [
      {
        id: 'delivery',
        name: 'Delivery',
        isMain: false,
        leadershipMode: 'own',
        parentIds: [],
        errors: [],
        valid: true,
      },
    ];

    const assignments: AssignmentItem[] = [
      {
        sourceRow: 1,
        member: 'Ana Perez',
        role: 'Manager',
        team: 'Delivery',
        errors: [],
        valid: true,
      },
      {
        sourceRow: 2,
        member: 'Juan Gomez',
        role: 'Developer',
        team: 'Delivery',
        errors: [],
        valid: true,
      },
    ];

    const { result } = renderHook(() => useLeadersCatalog());
    const built = result.current.build(teams, assignments);

    expect(built).toHaveLength(1);
    expect(built[0].leaderRole).toBe('');
    expect(built[0].valid).toBe(false);
    expect(built[0].errors).toContain('Rol lider: obligatorio.');
  });
});
