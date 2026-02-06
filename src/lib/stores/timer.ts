import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

// Types
export interface TimerSettings {
	gradations: number[]; // Duration options in minutes
	selectedSound: string;
	soundEnabled: boolean;
}

export interface CompletionStats {
	[duration: number]: number; // duration in minutes -> count of completions
}

export interface TimerState {
	selectedDuration: number; // in minutes
	remainingSeconds: number;
	isRunning: boolean;
	isComplete: boolean;
	taskName: string;
}

// Default values
const DEFAULT_GRADATIONS = [1, 5, 10, 20, 40];
const DEFAULT_SETTINGS: TimerSettings = {
	gradations: DEFAULT_GRADATIONS,
	selectedSound: 'chime',
	soundEnabled: true
};

const DEFAULT_STATE: TimerState = {
	selectedDuration: 1,
	remainingSeconds: 60,
	isRunning: false,
	isComplete: false,
	taskName: ''
};

// LocalStorage keys
const STORAGE_KEYS = {
	settings: 'clockin-settings',
	stats: 'clockin-stats',
	taskName: 'clockin-task'
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
				isComplete: false
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
		cleanup: () => {
			clearTimerInterval();
		}
	};
}

// Export stores
export const settings = createSettingsStore();
export const stats = createStatsStore();
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
