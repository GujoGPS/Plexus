import { create } from 'zustand';
import { Task } from '../types';
import { driveService } from '../modules/drive/DriveService';
import { v4 as uuidv4 } from 'uuid';

interface TasksState {
  tasks: Task[];
  archivedTasks: Task[];
  isLoading: boolean;
  error: string | null;
  loadTasks: () => Promise<void>;
  addTask: (title: string, priority: Task['priority'], dueDate: string | null, tags?: string[], energy?: number, role?: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  archiveCompleted: () => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  reorderTasks: (startIndex: number, endIndex: number) => Promise<void>; // Nova Função de Drag and Drop
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  archivedTasks: [],
  isLoading: false,
  error: null,

  loadTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await driveService.loadTasks();
      const active = tasks.filter(t => !t.completed);
      const archived = tasks.filter(t => t.completed);
      set({ tasks: active, archivedTasks: archived, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Failed to load tasks' });
    }
  },

  addTask: async (title, priority, dueDate, tags, energy, role) => {
    const newTask: Task = {
      id: uuidv4(),
      title,
      completed: false,
      priority,
      dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: tags || [],
      role: role || '',
      subtasks: [],
      energy: energy,
    };

    const { tasks } = get();
    const updatedTasks = [...tasks, newTask];

    set({ tasks: updatedTasks });

    try {
      const allTasks = [...updatedTasks, ...get().archivedTasks];
      await driveService.saveTasks(allTasks);
      await driveService.addHistoryEntry('task', 'create', newTask.id, newTask);
    } catch (error) {
      set({ tasks: tasks, error: 'Failed to save task' });
    }
  },

  updateTask: async (id, updates) => {
    const { tasks, archivedTasks } = get();
    const allTasks = [...tasks, ...archivedTasks];
    const taskIndex = allTasks.findIndex(t => t.id === id);

    if (taskIndex === -1) return;

    const oldTask = { ...allTasks[taskIndex] };
    const updatedTask = {
      ...allTasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    allTasks[taskIndex] = updatedTask;

    const active = allTasks.filter(t => !t.completed);
    const archived = allTasks.filter(t => t.completed);

    set({ tasks: active, archivedTasks: archived });

    try {
      await driveService.saveTasks(allTasks);
      await driveService.addHistoryEntry('task', 'update', id, { old: oldTask, new: updatedTask });
    } catch (error) {
      set({ tasks: tasks, archivedTasks: archivedTasks, error: 'Failed to update task' });
    }
  },

  deleteTask: async (id) => {
    const { tasks, archivedTasks } = get();
    const allTasks = [...tasks, ...archivedTasks];
    const task = allTasks.find(t => t.id === id);
    const filtered = allTasks.filter(t => t.id !== id);

    const active = filtered.filter(t => !t.completed);
    const archived = filtered.filter(t => t.completed);

    set({ tasks: active, archivedTasks: archived });

    try {
      await driveService.saveTasks(filtered);
      if (task) {
        await driveService.addHistoryEntry('task', 'delete', id, task);
      }
    } catch (error) {
      set({ tasks: tasks, archivedTasks: archivedTasks, error: 'Failed to delete task' });
    }
  },

  toggleComplete: async (id) => {
    const { tasks, archivedTasks } = get();
    const allTasks = [...tasks, ...archivedTasks];
    const taskIndex = allTasks.findIndex(t => t.id === id);

    if (taskIndex === -1) return;

    const task = allTasks[taskIndex];
    const wasCompleted = task.completed;

    const updatedTask = {
      ...task,
      completed: !wasCompleted,
      updatedAt: new Date().toISOString(),
    };

    allTasks[taskIndex] = updatedTask;

    const active = allTasks.filter(t => !t.completed);
    const archived = allTasks.filter(t => t.completed);

    set({ tasks: active, archivedTasks: archived });

    try {
      await driveService.saveTasks(allTasks);
      const action = wasCompleted ? 'update' : 'complete';
      await driveService.addHistoryEntry('task', action, id, updatedTask);
    } catch (error) {
      set({ tasks: tasks, archivedTasks: archivedTasks, error: 'Failed to update task' });
    }
  },

  archiveCompleted: async () => {},

  addSubtask: async (taskId, title) => {
    const { tasks, archivedTasks } = get();
    const allTasks = [...tasks, ...archivedTasks];
    const taskIndex = allTasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) return;

    const task = allTasks[taskIndex];
    const newSubtask = { id: uuidv4(), title, completed: false };

    const updatedSubtasks = [...(task.subtasks || []), newSubtask];
    const updatedTask = { ...task, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() };

    allTasks[taskIndex] = updatedTask;
    const active = allTasks.filter(t => !t.completed);
    const archived = allTasks.filter(t => t.completed);

    set({ tasks: active, archivedTasks: archived });

    try {
      await driveService.saveTasks(allTasks);
    } catch (error) {
      set({ tasks: tasks, archivedTasks: archivedTasks, error: 'Failed to add subtask' });
    }
  },

  toggleSubtask: async (taskId, subtaskId) => {
    const { tasks, archivedTasks } = get();
    const allTasks = [...tasks, ...archivedTasks];
    const taskIndex = allTasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) return;

    const task = allTasks[taskIndex];
    const subtaskIndex = (task.subtasks || []).findIndex(s => s.id === subtaskId);

    if (subtaskIndex === -1) return;

    const updatedSubtasks = [...(task.subtasks || [])];
    updatedSubtasks[subtaskIndex] = {
      ...updatedSubtasks[subtaskIndex],
      completed: !updatedSubtasks[subtaskIndex].completed,
    };

    const updatedTask = { ...task, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() };
    allTasks[taskIndex] = updatedTask;

    const active = allTasks.filter(t => !t.completed);
    const archived = allTasks.filter(t => t.completed);

    set({ tasks: active, archivedTasks: archived });

    try {
      await driveService.saveTasks(allTasks);
    } catch (error) {
      set({ tasks: tasks, archivedTasks: archivedTasks, error: 'Failed to toggle subtask' });
    }
  },

  deleteSubtask: async (taskId, subtaskId) => {
    const { tasks, archivedTasks } = get();
    const allTasks = [...tasks, ...archivedTasks];
    const taskIndex = allTasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) return;

    const task = allTasks[taskIndex];
    const updatedSubtasks = (task.subtasks || []).filter(s => s.id !== subtaskId);

    const updatedTask = { ...task, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() };
    allTasks[taskIndex] = updatedTask;

    const active = allTasks.filter(t => !t.completed);
    const archived = allTasks.filter(t => t.completed);

    set({ tasks: active, archivedTasks: archived });

    try {
      await driveService.saveTasks(allTasks);
    } catch (error) {
      set({ tasks: tasks, archivedTasks: archivedTasks, error: 'Failed to delete subtask' });
    }
  },

  // NOVA LÓGICA DE DRAG AND DROP
  reorderTasks: async (startIndex: number, endIndex: number) => {
    const { tasks, archivedTasks } = get();
    const newTasks = Array.from(tasks);
    const [removed] = newTasks.splice(startIndex, 1);
    newTasks.splice(endIndex, 0, removed);

    set({ tasks: newTasks });

    try {
      const allTasks = [...newTasks, ...archivedTasks];
      await driveService.saveTasks(allTasks);
    } catch (error) {
      console.error('Failed to reorder tasks');
    }
  }
}));