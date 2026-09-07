import * as crypto from 'crypto';

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  dueDate?: string; // ISO date string YYYY-MM-DD
  createdAt: number;
  updatedAt: number;
  lastModifiedBy: 'human' | 'ai';
}

export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTaskInput = Partial<Pick<Task, 'title' | 'description' | 'tags' | 'dueDate' | 'lastModifiedBy'>>;

const tasksByUser = new Map<string, Task[]>();

function getUserTasks(userId: string): Task[] {
  if (!tasksByUser.has(userId)) {
    tasksByUser.set(userId, []);
  }
  return tasksByUser.get(userId)!;
}

export const taskDb = {
  /** Returns a shallow copy of all tasks for the user. */
  list(userId: string, filters?: { status?: TaskStatus; priority?: TaskPriority; tag?: string }): Task[] {
    let tasks = [...getUserTasks(userId)];
    if (filters?.status) tasks = tasks.filter(t => t.status === filters.status);
    if (filters?.priority) tasks = tasks.filter(t => t.priority === filters.priority);
    if (filters?.tag) tasks = tasks.filter(t => t.tags.includes(filters.tag!));
    return tasks.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  get(userId: string, id: string): Task | null {
    return getUserTasks(userId).find(t => t.id === id) ?? null;
  },

  create(userId: string, input: CreateTaskInput): Task {
    const now = Date.now();
    const task: Task = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    getUserTasks(userId).push(task);
    return task;
  },

  update(userId: string, id: string, patch: UpdateTaskInput): Task | null {
    const tasks = getUserTasks(userId);
    const task = tasks.find(t => t.id === id);
    if (!task) return null;
    
    // Prevent Object.assign from overwriting with undefined
    const cleanPatch = Object.fromEntries(
      Object.entries(patch).filter(([_, v]) => v !== undefined)
    );
    
    Object.assign(task, cleanPatch, { updatedAt: Date.now() });
    return task;
  },

  updateStatus(userId: string, id: string, status: TaskStatus, by: 'human' | 'ai'): Task | null {
    const tasks = getUserTasks(userId);
    const task = tasks.find(t => t.id === id);
    if (!task) return null;
    task.status = status;
    task.lastModifiedBy = by;
    task.updatedAt = Date.now();
    return task;
  },

  updatePriority(userId: string, id: string, priority: TaskPriority, by: 'human' | 'ai'): Task | null {
    const tasks = getUserTasks(userId);
    const task = tasks.find(t => t.id === id);
    if (!task) return null;
    task.priority = priority;
    task.lastModifiedBy = by;
    task.updatedAt = Date.now();
    return task;
  },

  delete(userId: string, id: string): boolean {
    const tasks = getUserTasks(userId);
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return false;
    tasks.splice(index, 1);
    return true;
  },

  deleteAll(userId: string): number {
    const count = getUserTasks(userId).length;
    tasksByUser.set(userId, []);
    return count;
  },

  /** Returns the internal array — used for seeding only. */
  _raw(userId: string): Task[] {
    return getUserTasks(userId);
  },
};
