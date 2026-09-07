import { taskDb } from './db';

const SEED_USER_FLAG = new Set<string>();

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function seedUserIfEmpty(userId: string): void {
  if (SEED_USER_FLAG.has(userId)) return;
  if (taskDb._raw(userId).length > 0) {
    SEED_USER_FLAG.add(userId);
    return;
  }

  const now = Date.now();

  const seeds = [
    {
      title: 'Finish onboarding docs',
      description: 'Complete the getting-started guide for new developers.',
      status: 'in-progress' as const,
      priority: 'high' as const,
      tags: ['docs'],
      dueDate: todayPlus(1),
      lastModifiedBy: 'human' as const,
      createdAt: now - 1000 * 60 * 60 * 3,
      updatedAt: now - 1000 * 60 * 60 * 3,
    },
    {
      title: 'Review pull request #42',
      description: 'Review the new auth middleware changes before merging.',
      status: 'todo' as const,
      priority: 'medium' as const,
      tags: ['code-review'],
      lastModifiedBy: 'human' as const,
      createdAt: now - 1000 * 60 * 60 * 5,
      updatedAt: now - 1000 * 60 * 60 * 5,
    },
    {
      title: 'Schedule team standup',
      description: 'Set up a recurring meeting for the new sprint.',
      status: 'done' as const,
      priority: 'low' as const,
      tags: ['meetings'],
      lastModifiedBy: 'human' as const,
      createdAt: now - 1000 * 60 * 60 * 24,
      updatedAt: now - 1000 * 60 * 60 * 24,
    },
    {
      title: 'Deploy staging build',
      description: 'Deploy the latest main branch to the staging environment.',
      status: 'todo' as const,
      priority: 'high' as const,
      tags: ['devops'],
      dueDate: todayPlus(2),
      lastModifiedBy: 'human' as const,
      createdAt: now - 1000 * 60 * 60 * 2,
      updatedAt: now - 1000 * 60 * 60 * 2,
    },
    {
      title: 'Write release notes',
      description: 'Document all changes for the v1.0 release.',
      status: 'todo' as const,
      priority: 'medium' as const,
      tags: ['docs'],
      lastModifiedBy: 'human' as const,
      createdAt: now - 1000 * 60 * 30,
      updatedAt: now - 1000 * 60 * 30,
    },
  ];

  for (const seed of seeds) {
    taskDb.create(userId, seed);
    // Override the auto-generated timestamps with realistic ones
    const task = taskDb._raw(userId).at(-1)!;
    task.createdAt = seed.createdAt;
    task.updatedAt = seed.updatedAt;
  }

  SEED_USER_FLAG.add(userId);
}
