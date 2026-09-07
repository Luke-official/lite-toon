import { Capability, ExecutionContext } from '@lite-toon/core';
import { taskDb, TaskStatus, TaskPriority } from './db';
import { seedUserIfEmpty } from './seed';

function requireUserId(context?: ExecutionContext): string {
  if (!context?.userId || context.userId === 'anonymous') {
    throw new Error('Authenticated user is required for this operation.');
  }
  return context.userId;
}

function getAndSeed(context?: ExecutionContext): string {
  const userId = requireUserId(context);
  seedUserIfEmpty(userId);
  return userId;
}

// ─────────────────────────────────────────
// READ capabilities
// ─────────────────────────────────────────

export const listTasks: Capability = {
  name: 'listTasks',
  description:
    'Returns the user\'s tasks. Optionally filter by status ("todo", "in-progress", "done"), priority ("low", "medium", "high"), or a tag string.',
  scopes: ['tasks:read'],
  riskLevel: 'read',
  schema: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['todo', 'in-progress', 'done'] },
      priority: { type: 'string', enum: ['low', 'medium', 'high'] },
      tag: { type: 'string' },
    },
  },
  execute: async (params: { status?: TaskStatus; priority?: TaskPriority; tag?: string }, context) => {
    const userId = getAndSeed(context);
    const tasks = taskDb.list(userId, params);
    return { success: true, data: tasks };
  },
};

export const getTask: Capability = {
  name: 'getTask',
  description: 'Returns a single task by its ID.',
  scopes: ['tasks:read'],
  riskLevel: 'read',
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  },
  execute: async (params: { id: string }, context) => {
    const userId = getAndSeed(context);
    const task = taskDb.get(userId, params.id);
    if (!task) return { success: false, message: `Task "${params.id}" not found.` };
    return { success: true, data: task };
  },
};

// ─────────────────────────────────────────
// WRITE capabilities (fully autonomous)
// ─────────────────────────────────────────

export const createTask: Capability = {
  name: 'createTask',
  description:
    'Creates a new task. Required: title. Optional: description, status ("todo", "in-progress", "done"), priority ("low", "medium", "high"), tags (array of strings), dueDate (YYYY-MM-DD).',
  scopes: ['tasks:write'],
  riskLevel: 'write',
  schema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      status: { type: 'string', enum: ['todo', 'in-progress', 'done'] },
      priority: { type: 'string', enum: ['low', 'medium', 'high'] },
      tags: { type: 'array', items: { type: 'string' } },
      dueDate: { type: 'string' },
    },
    required: ['title'],
  },
  execute: async (
    params: { title: string; description?: string; status?: TaskStatus; priority?: TaskPriority; tags?: string[]; dueDate?: string },
    context
  ) => {
    const userId = getAndSeed(context);
    const task = taskDb.create(userId, {
      title: params.title,
      description: params.description,
      status: params.status ?? 'todo',
      priority: params.priority ?? 'medium',
      tags: params.tags ?? [],
      dueDate: params.dueDate,
      lastModifiedBy: 'ai',
    });
    return { success: true, data: task };
  },
};

export const updateTask: Capability = {
  name: 'updateTask',
  description: 'Updates the title, description, tags, or dueDate of an existing task. Use setStatus or setPriority to change status or priority.',
  scopes: ['tasks:write'],
  riskLevel: 'write',
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      dueDate: { type: 'string' },
    },
    required: ['id'],
  },
  execute: async (
    params: { id: string; title?: string; description?: string; tags?: string[]; dueDate?: string },
    context
  ) => {
    const userId = getAndSeed(context);
    const { id, ...patch } = params;
    const task = taskDb.update(userId, id, { ...patch, lastModifiedBy: 'ai' });
    if (!task) return { success: false, message: `Task "${id}" not found.` };
    return { success: true, data: task };
  },
};

export const setStatus: Capability = {
  name: 'setStatus',
  description: 'Changes the status of a task. Valid statuses: "todo", "in-progress", "done".',
  scopes: ['tasks:write'],
  riskLevel: 'write',
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      status: { type: 'string', enum: ['todo', 'in-progress', 'done'] },
    },
    required: ['id', 'status'],
  },
  execute: async (params: { id: string; status: TaskStatus }, context) => {
    const userId = getAndSeed(context);
    const task = taskDb.updateStatus(userId, params.id, params.status, 'ai');
    if (!task) return { success: false, message: `Task "${params.id}" not found.` };
    return { success: true, data: task };
  },
};

export const setPriority: Capability = {
  name: 'setPriority',
  description: 'Changes the priority of a task. Valid priorities: "low", "medium", "high".',
  scopes: ['tasks:write'],
  riskLevel: 'write',
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    },
    required: ['id', 'priority'],
  },
  execute: async (params: { id: string; priority: TaskPriority }, context) => {
    const userId = getAndSeed(context);
    const task = taskDb.updatePriority(userId, params.id, params.priority, 'ai');
    if (!task) return { success: false, message: `Task "${params.id}" not found.` };
    return { success: true, data: task };
  },
};

export const bulkSetStatus: Capability = {
  name: 'bulkSetStatus',
  description:
    'Changes the status of multiple tasks at once. Provide an array of task IDs and the target status. Perfect for batch operations like "mark all in-progress tasks as done".',
  scopes: ['tasks:write'],
  riskLevel: 'write',
  schema: {
    type: 'object',
    properties: {
      ids: { type: 'array', items: { type: 'string' } },
      status: { type: 'string', enum: ['todo', 'in-progress', 'done'] },
    },
    required: ['ids', 'status'],
  },
  execute: async (params: { ids: string[]; status: TaskStatus }, context) => {
    const userId = getAndSeed(context);
    const results = params.ids.map(id => taskDb.updateStatus(userId, id, params.status, 'ai'));
    const updated = results.filter(Boolean);
    return {
      success: true,
      data: { updated: updated.length, tasks: updated },
      message: `Updated ${updated.length} of ${params.ids.length} tasks to "${params.status}".`,
    };
  },
};

export const bulkSetPriority: Capability = {
  name: 'bulkSetPriority',
  description: 'Changes the priority of multiple tasks at once. Provide an array of task IDs and the target priority.',
  scopes: ['tasks:write'],
  riskLevel: 'write',
  schema: {
    type: 'object',
    properties: {
      ids: { type: 'array', items: { type: 'string' } },
      priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    },
    required: ['ids', 'priority'],
  },
  execute: async (params: { ids: string[]; priority: TaskPriority }, context) => {
    const userId = getAndSeed(context);
    const results = params.ids.map(id => taskDb.updatePriority(userId, id, params.priority, 'ai'));
    const updated = results.filter(Boolean);
    return {
      success: true,
      data: { updated: updated.length, tasks: updated },
      message: `Updated ${updated.length} of ${params.ids.length} tasks to "${params.priority}" priority.`,
    };
  },
};

// ─────────────────────────────────────────
// DESTRUCTIVE capabilities (HITL required)
// ─────────────────────────────────────────

export const deleteTask: Capability = {
  name: 'deleteTask',
  description:
    'Permanently deletes a single task by ID. This action is irreversible and requires human approval. After approval is granted, retry with the _approvalToken.',
  scopes: ['tasks:admin'],
  riskLevel: 'destructive',
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  },
  execute: async (params: { id: string }, context) => {
    const userId = getAndSeed(context);
    const deleted = taskDb.delete(userId, params.id);
    if (!deleted) return { success: false, message: `Task "${params.id}" not found.` };
    return { success: true, message: `Task "${params.id}" permanently deleted.` };
  },
};

export const nukeAllTasks: Capability = {
  name: 'nukeAllTasks',
  description:
    'Permanently deletes ALL tasks on the board. This is irreversible and requires human approval. Use only when explicitly instructed to wipe the entire board.',
  scopes: ['tasks:admin'],
  riskLevel: 'destructive',
  execute: async (_params, context) => {
    const userId = getAndSeed(context);
    const count = taskDb.deleteAll(userId);
    return { success: true, message: `Permanently deleted all ${count} tasks.` };
  },
};

export const ALL_CAPABILITIES = [
  listTasks,
  getTask,
  createTask,
  updateTask,
  setStatus,
  setPriority,
  bulkSetStatus,
  bulkSetPriority,
  deleteTask,
  nukeAllTasks,
];
