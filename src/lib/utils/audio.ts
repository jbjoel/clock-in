import { browser } from '$app/environment';

// Audio context for generating tones
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
	if (!audioContext && browser) {
		audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
	}
	return audioContext!;
}

// Sound definitions using Web Audio API (no external files needed)
const sounds = {
	chime: () => playChime(),
	bell: () => playBell(),
	digital: () => playDigital()
};

function playChime() {
	const ctx = getAudioContext();
	if (!ctx) return;

	const now = ctx.currentTime;

	// Create a pleasant chime with harmonics
	const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 chord

	frequencies.forEach((freq, i) => {
		const oscillator = ctx.createOscillator();
		const gainNode = ctx.createGain();

		oscillator.type = 'sine';
		oscillator.frequency.setValueAtTime(freq, now);

		gainNode.gain.setValueAtTime(0, now);
		gainNode.gain.linearRampToValueAtTime(0.15, now + 0.02);
		gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

		oscillator.connect(gainNode);
		gainNode.connect(ctx.destination);

		oscillator.start(now + i * 0.1);
		oscillator.stop(now + 2);
	});
}

function playBell() {
	const ctx = getAudioContext();
	if (!ctx) return;

	const now = ctx.currentTime;

	// Deep meditation bell
	const oscillator = ctx.createOscillator();
	const gainNode = ctx.createGain();

	oscillator.type = 'sine';
	oscillator.frequency.setValueAtTime(220, now); // A3

	gainNode.gain.setValueAtTime(0, now);
	gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
	gainNode.gain.exponentialRampToValueAtTime(0.001, now + 3);

	// Add some harmonics
	const harmonic = ctx.createOscillator();
	const harmGain = ctx.createGain();
	harmonic.type = 'sine';
	harmonic.frequency.setValueAtTime(440, now);
	harmGain.gain.setValueAtTime(0, now);
	harmGain.gain.linearRampToValueAtTime(0.1, now + 0.01);
	harmGain.gain.exponentialRampToValueAtTime(0.001, now + 2);

	oscillator.connect(gainNode);
	gainNode.connect(ctx.destination);
	harmonic.connect(harmGain);
	harmGain.connect(ctx.destination);

	oscillator.start(now);
	oscillator.stop(now + 3);
	harmonic.start(now);
	harmonic.stop(now + 2);
}

function playDigital() {
	const ctx = getAudioContext();
	if (!ctx) return;

	const now = ctx.currentTime;

	// Digital beep pattern
	const beeps = [
		{ freq: 880, start: 0, duration: 0.1 },
		{ freq: 880, start: 0.15, duration: 0.1 },
		{ freq: 1100, start: 0.3, duration: 0.2 }
	];

	beeps.forEach(({ freq, start, duration }) => {
		const oscillator = ctx.createOscillator();
		const gainNode = ctx.createGain();

		oscillator.type = 'square';
		oscillator.frequency.setValueAtTime(freq, now + start);

		gainNode.gain.setValueAtTime(0, now + start);
		gainNode.gain.linearRampToValueAtTime(0.08, now + start + 0.01);
		gainNode.gain.setValueAtTime(0.08, now + start + duration - 0.01);
		gainNode.gain.linearRampToValueAtTime(0, now + start + duration);

		oscillator.connect(gainNode);
		gainNode.connect(ctx.destination);

		oscillator.start(now + start);
		oscillator.stop(now + start + duration);
	});
}

export function playSound(soundId: string): void {
	if (!browser) return;

	try {
		// Resume audio context if suspended (needed for user gesture requirement)
		if (audioContext?.state === 'suspended') {
			audioContext.resume();
		}

		const soundFn = sounds[soundId as keyof typeof sounds];
		if (soundFn) {
			soundFn();
		} else {
			// Default to chime
			playChime();
		}
	} catch (e) {
		console.error('Failed to play sound:', e);
	}
}

export function previewSound(soundId: string): void {
	playSound(soundId);
}
