import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, Trash2, Moon, Sun, Plus, Flag, Edit2, X, Check } from 'lucide-react';
import { Task, Priority } from './types';

type FilterType = 'all' | 'active' | 'completed';

export default function App() {
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Load from Local Storage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('todo-tasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error('Failed to parse tasks from local storage');
      }
    }

    const savedTheme = localStorage.getItem('todo-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    
    setIsLoaded(true);
  }, []);

  // Save to Local Storage whenever tasks change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('todo-tasks', JSON.stringify(tasks));
    }
  }, [tasks, isLoaded]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  // Handle Theme Toggle
  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      if (newTheme) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('todo-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('todo-theme', 'light');
      }
      return newTheme;
    });
  };

  // Add Task
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      text: newTaskText.trim(),
      completed: false,
      priority: newTaskPriority,
      createdAt: Date.now(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTaskText('');
  };

  // Toggle Task Completion
  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Delete Task
  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  // Edit Task
  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditValue(task.text);
  };

  const saveEdit = () => {
    if (!editValue.trim()) {
      setEditingId(null);
      return;
    }
    setTasks((prev) =>
      prev.map((task) =>
        task.id === editingId ? { ...task, text: editValue.trim() } : task
      )
    );
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  // Clear Completed
  const clearCompleted = () => {
    setTasks((prev) => prev.filter((task) => !task.completed));
  };

  // Priority Styles Helper
  const getPriorityStyles = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
      case 'medium':
        return 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
      case 'low':
        return 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
    }
  };

  // Filter and Sort tasks
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    
    return b.createdAt - a.createdAt;
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
  };
  
  const progressPercentage = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-3xl mx-auto">
        
        {/* Header & Progress */}
        <header className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Tasks
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium">
                {stats.completed} of {stats.total} completed &middot; {progressPercentage}% done
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </header>

        {/* Add Task Form */}
        <form onSubmit={addTask} className="mb-8 relative z-10">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full pl-4 pr-4 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              />
            </div>
            
            <div className="flex gap-3">
              <div className="relative">
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                  className="appearance-none h-full pl-10 pr-8 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 transition-all text-zinc-700 dark:text-zinc-300 cursor-pointer font-medium"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <Flag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
              
              <button
                type="submit"
                disabled={!newTaskText.trim()}
                className="flex items-center justify-center px-6 py-3.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-medium shadow-sm hover:bg-zinc-800 dark:hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/50 dark:focus:ring-zinc-100/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={20} className="sm:mr-2" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
          </div>
        </form>

        {/* Filters & Actions */}
        {tasks.length > 0 && (
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800/50">
              {(['all', 'active', 'completed'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${
                    filter === f
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            
            {stats.completed > 0 && (
              <button
                onClick={clearCompleted}
                className="text-sm font-medium text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                Clear completed
              </button>
            )}
          </div>
        )}

        {/* Task List */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          {tasks.length === 0 ? (
            <div className="py-20 px-6 text-center">
              <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100 dark:border-zinc-800">
                <CheckCircle2 size={32} className="text-zinc-300 dark:text-zinc-600" />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">Your day is clear</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">What will you accomplish today?</p>
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <p className="text-zinc-500 dark:text-zinc-400">No {filter} tasks found.</p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              <AnimatePresence initial={false}>
                {sortedTasks.map((task) => (
                  <motion.li
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.2 }}
                    className={`group flex items-center gap-3 sm:gap-4 p-4 sm:p-5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30 ${
                      task.completed ? 'bg-zinc-50/50 dark:bg-zinc-900/50' : ''
                    }`}
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="flex-shrink-0 text-zinc-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors focus:outline-none mt-0.5 self-start sm:self-center"
                    >
                      {task.completed ? (
                        <CheckCircle2 size={24} className="text-indigo-500 dark:text-indigo-400" />
                      ) : (
                        <Circle size={24} />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      {editingId === task.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="flex-1 bg-white dark:bg-zinc-950 border border-indigo-500/50 dark:border-indigo-400/50 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-zinc-900 dark:text-zinc-100"
                          />
                          <button onClick={saveEdit} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10 rounded-md transition-colors">
                            <Check size={16} />
                          </button>
                          <button onClick={cancelEdit} className="p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span
                            onDoubleClick={() => startEditing(task)}
                            className={`block text-base transition-all duration-200 break-words ${
                              task.completed
                                ? 'text-zinc-400 dark:text-zinc-500 line-through'
                                : 'text-zinc-700 dark:text-zinc-200'
                            }`}
                          >
                            {task.text}
                          </span>
                          
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${getPriorityStyles(
                              task.priority
                            )} ${task.completed ? 'opacity-50' : ''} sm:ml-auto w-fit`}
                          >
                            {task.priority}
                          </span>
                        </>
                      )}
                    </div>

                    {editingId !== task.id && (
                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity self-start sm:self-center">
                        <button
                          onClick={() => startEditing(task)}
                          className="p-2 text-zinc-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all focus:outline-none focus:opacity-100"
                          aria-label="Edit task"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-2 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all focus:outline-none focus:opacity-100"
                          aria-label="Delete task"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
        
        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <p>&copy; 2026 Designed &amp; Developed by Ubaidullah</p>
        </footer>
        
      </div>
    </div>
  );
}
