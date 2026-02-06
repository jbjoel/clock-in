import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

// Types
export interface TimerSettings {
	gradations: number[]; // Duration options in minutes
	selectedSound: string;
	soundEnabled: boolean;
	autoStart: boolean; // Automatically start next timer after completion
	cooldownEnabled: boolean; // Enable cooldown period between focus sessions
	cooldownDuration: number; // Cooldown duration in minutes
	cooldownAutoStart: boolean; // Automatically start cooldown after focus completes
}

export interface CompletionStats {
	[duration: number]: number; // duration in minutes -> count of completions
}

export interface TaskStats {
	[taskName: string]: number; // task name -> total minutes focused
}

export interface TimerState {
	selectedDuration: number; // in minutes
	remainingSeconds: number;
	isRunning: boolean;
	isComplete: boolean;
	taskName: string;
	isCooldown: boolean; // Whether currently in cooldown mode
}

// Default values
const DEFAULT_GRADATIONS = [1, 5, 10, 20, 40];
const DEFAULT_SETTINGS: TimerSettings = {
	gradations: DEFAULT_GRADATIONS,
	selectedSound: 'chime',
	soundEnabled: true,
	autoStart: false,
	cooldownEnabled: false,
	cooldownDuration: 2,
	cooldownAutoStart: true
};

const DEFAULT_STATE: TimerState = {
	selectedDuration: 1,
	remainingSeconds: 60,
	isRunning: false,
	isComplete: false,
	taskName: '',
	isCooldown: false
};

// LocalStorage keys
const STORAGE_KEYS = {
	settings: 'clockin-settings',
	stats: 'clockin-stats',
	taskName: 'clockin-task',
	taskStats: 'clockin-task-stats',
	taskHistory: 'clockin-task-history'
};

// Helper to safely access localStorage
function loadFromStorage<T>(key: string, fallback: T): T {
	if (!browser) return fallback;
	try {
		const stored = localStorage.getItem(key);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (e) {
		console.error(`Failed to load ${key} from localStorage:`, e);
	}
	return fallback;
}

function saveToStorage<T>(key: string, value: T): void {
	if (!browser) return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (e) {
		console.error(`Failed to save ${key} to localStorage:`, e);
	}
}

// Create stores
function createSettingsStore() {
	const initial = loadFromStorage<TimerSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
	const { subscribe, set, update } = writable<TimerSettings>(initial);

	return {
		subscribe,
		setGradations: (gradations: number[]) => {
			update((s) => {
				const newSettings = { ...s, gradations: gradations.sort((a, b) => a - b) };
				saveToStorage(STORAGE_KEYS.settings, newSettings);
				return newSettings;
			});
		},
		setSound: (sound: string) => {
			update((s) => {
				const newSettings = { ...s, selectedSound: sound };
				saveToStorage(STORAGE_KEYS.settings, newSettings);
				return newSettings;
			});
		},
		toggleSound: () => {
			update((s) => {
				const newSettings = { ...s, soundEnabled: !s.soundEnabled };
				saveToStorage(STORAGE_KEYS.settings, newSettings);
				return newSettings;
			});
		},
		toggleAutoStart: () => {
			update((s) => {
				const newSettings = { ...s, autoStart: !s.autoStart };
				saveToStorage(STORAGE_KEYS.settings, newSettings);
				return newSettings;
			});
		},
		toggleCooldown: () => {
			update((s) => {
				const newSettings = { ...s, cooldownEnabled: !s.cooldownEnabled };
				saveToStorage(STORAGE_KEYS.settings, newSettings);
				return newSettings;
			});
		},
		setCooldownDuration: (minutes: number) => {
			update((s) => {
				const newSettings = { ...s, cooldownDuration: Math.max(1, Math.min(30, minutes)) };
				saveToStorage(STORAGE_KEYS.settings, newSettings);
				return newSettings;
			});
		},
		toggleCooldownAutoStart: () => {
			update((s) => {
				const newSettings = { ...s, cooldownAutoStart: !s.cooldownAutoStart };
				saveToStorage(STORAGE_KEYS.settings, newSettings);
				return newSettings;
			});
		},
		reset: () => {
			set(DEFAULT_SETTINGS);
			saveToStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
		}
	};
}

function createStatsStore() {
	const initial = loadFromStorage<CompletionStats>(STORAGE_KEYS.stats, {});
	const { subscribe, set, update } = writable<CompletionStats>(initial);

	return {
		subscribe,
		recordCompletion: (duration: number) => {
			update((stats) => {
				const newStats = { ...stats, [duration]: (stats[duration] || 0) + 1 };
				saveToStorage(STORAGE_KEYS.stats, newStats);
				return newStats;
			});
		},
		reset: () => {
			set({});
			saveToStorage(STORAGE_KEYS.stats, {});
		},
		getCount: (duration: number): number => {
			const stats = get({ subscribe });
			return stats[duration] || 0;
		}
	};
}

function createTaskStatsStore() {
	const initial = loadFromStorage<TaskStats>(STORAGE_KEYS.taskStats, {});
	const { subscribe, set, update } = writable<TaskStats>(initial);

	return {
		subscribe,
		recordMinutes: (taskName: string, minutes: number) => {
			if (!taskName.trim()) return; // Don't record empty task names
			const normalizedName = taskName.trim();
			update((stats) => {
				const newStats = { ...stats, [normalizedName]: (stats[normalizedName] || 0) + minutes };
				saveToStorage(STORAGE_KEYS.taskStats, newStats);
				return newStats;
			});
		},
		reset: () => {
			set({});
			saveToStorage(STORAGE_KEYS.taskStats, {});
		},
		getMinutes: (taskName: string): number => {
			const stats = get({ subscribe });
			return stats[taskName.trim()] || 0;
		}
	};
}

function createTaskHistoryStore() {
	const initial = loadFromStorage<string[]>(STORAGE_KEYS.taskHistory, []);
	const { subscribe, set, update } = writable<string[]>(initial);

	return {
		subscribe,
		addTask: (taskName: string) => {
			if (!taskName.trim()) return; // Don't add empty task names
			const normalizedName = taskName.trim();
			update((history) => {
				// Remove if already exists (to move to front)
				const filtered = history.filter((t) => t !== normalizedName);
				// Add to front, limit to 20 recent tasks
				const newHistory = [normalizedName, ...filtered].slice(0, 20);
				saveToStorage(STORAGE_KEYS.taskHistory, newHistory);
				return newHistory;
			});
		},
		removeTask: (taskName: string) => {
			update((history) => {
				const newHistory = history.filter((t) => t !== taskName);
				saveToStorage(STORAGE_KEYS.taskHistory, newHistory);
				return newHistory;
			});
		},
		reset: () => {
			set([]);
			saveToStorage(STORAGE_KEYS.taskHistory, []);
		}
	};
}

function createTimerStore() {
	const savedTaskName = loadFromStorage<string>(STORAGE_KEYS.taskName, '');
	const initial: TimerState = { ...DEFAULT_STATE, taskName: savedTaskName };
	const { subscribe, set, update } = writable<TimerState>(initial);

	let intervalId: ReturnType<typeof setInterval> | null = null;

	function clearTimerInterval() {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
	}

	function tick() {
		update((state) => {
			if (state.remainingSeconds <= 1) {
				clearTimerInterval();
				return { ...state, remainingSeconds: 0, isRunning: false, isComplete: true };
			}
			return { ...state, remainingSeconds: state.remainingSeconds - 1 };
		});
	}

	return {
		subscribe,
		selectDuration: (minutes: number) => {
			clearTimerInterval();
			update((state) => ({
				...state,
				selectedDuration: minutes,
				remainingSeconds: minutes * 60,
				isRunning: false,
				isComplete: false,
				isCooldown: false
			}));
		},
		start: () => {
			update((state) => {
				if (state.isRunning || state.remainingSeconds <= 0) return state;
				clearTimerInterval();
				intervalId = setInterval(tick, 1000);
				return { ...state, isRunning: true, isComplete: false };
			});
		},
		pause: () => {
			clearTimerInterval();
			update((state) => ({ ...state, isRunning: false }));
		},
		reset: () => {
			clearTimerInterval();
			update((state) => ({
				...state,
				remainingSeconds: state.selectedDuration * 60,
				isRunning: false,
				isComplete: false
			}));
		},
		setTaskName: (name: string) => {
			update((state) => ({ ...state, taskName: name }));
			saveToStorage(STORAGE_KEYS.taskName, name);
		},
		acknowledgeComplete: () => {
			update((state) => ({ ...state, isComplete: false }));
		},
		startCooldown: (durationMinutes: number) => {
			clearTimerInterval();
			update((state) => ({
				...state,
				selectedDuration: durationMinutes,
				remainingSeconds: durationMinutes * 60,
				isRunning: false,
				isComplete: false,
				isCooldown: true
			}));
		},
		endCooldown: () => {
			clearTimerInterval();
			update((state) => ({
				...state,
				isRunning: false,
				isComplete: false,
				isCooldown: false
			}));
		},
		cleanup: () => {
			clearTimerInterval();
		}
	};
}

// Export stores
export const settings = createSettingsStore();
export const stats = createStatsStore();
export const taskStats = createTaskStatsStore();
export const taskHistory = createTaskHistoryStore();
export const timer = createTimerStore();

// Derived stores for convenience
export const formattedTime = derived(timer, ($timer) => {
	const minutes = Math.floor($timer.remainingSeconds / 60);
	const seconds = $timer.remainingSeconds % 60;
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

export const progress = derived(timer, ($timer) => {
	const totalSeconds = $timer.selectedDuration * 60;
	return totalSeconds > 0 ? ($timer.remainingSeconds / totalSeconds) * 100 : 100;
});

// Helper to get the next duration in the gradation sequence
export function getNextDuration(currentDuration: number, gradations: number[]): number {
	const sorted = [...gradations].sort((a, b) => a - b);
	const currentIndex = sorted.indexOf(currentDuration);
	if (currentIndex === -1 || currentIndex === sorted.length - 1) {
		// If not found or at the end, wrap to the first duration
		return sorted[0];
	}
	return sorted[currentIndex + 1];
}
