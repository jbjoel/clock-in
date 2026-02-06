import confetti from 'canvas-confetti';

type CelebrationType =
	| 'classic'
	| 'fireworks'
	| 'stars'
	| 'snow'
	| 'cannon'
	| 'pride'
	| 'explosion'
	| 'shower';

const celebrationTypes: CelebrationType[] = [
	'classic',
	'fireworks',
	'stars',
	'snow',
	'cannon',
	'pride',
	'explosion',
	'shower'
];

/**
 * Classic confetti burst from center
 */
function classicConfetti() {
	confetti({
		particleCount: 100,
		spread: 70,
		origin: { y: 0.6 }
	});
}

/**
 * Fireworks - multiple bursts at random positions
 */
function fireworksConfetti() {
	const duration = 2000;
	const end = Date.now() + duration;

	const interval = setInterval(() => {
		if (Date.now() > end) {
			clearInterval(interval);
			return;
		}

		confetti({
			particleCount: 30,
			startVelocity: 30,
			spread: 360,
			origin: {
				x: Math.random(),
				y: Math.random() * 0.5
			}
		});
	}, 250);
}

/**
 * Star-shaped confetti
 */
function starsConfetti() {
	const defaults = {
		spread: 360,
		ticks: 100,
		gravity: 0.5,
		decay: 0.94,
		startVelocity: 20,
		shapes: ['star'] as confetti.Shape[],
		colors: ['#FFD700', '#FFA500', '#FF6347', '#FFE4B5', '#FFDAB9']
	};

	confetti({
		...defaults,
		particleCount: 50,
		scalar: 1.2,
		origin: { y: 0.5 }
	});

	setTimeout(() => {
		confetti({
			...defaults,
			particleCount: 30,
			scalar: 0.8,
			origin: { y: 0.6 }
		});
	}, 150);
}

/**
 * Gentle snow-like falling confetti
 */
function snowConfetti() {
	const duration = 3000;
	const end = Date.now() + duration;

	const frame = () => {
		if (Date.now() > end) return;

		confetti({
			particleCount: 3,
			startVelocity: 0,
			ticks: 200,
			origin: {
				x: Math.random(),
				y: 0
			},
			colors: ['#ffffff', '#f0f0f0', '#e8e8e8'],
			shapes: ['circle'],
			gravity: 0.3,
			scalar: 1.5,
			drift: Math.random() - 0.5
		});

		requestAnimationFrame(frame);
	};

	frame();
}

/**
 * Cannon blast from both sides
 */
function cannonConfetti() {
	// Left cannon
	confetti({
		particleCount: 80,
		angle: 60,
		spread: 55,
		origin: { x: 0, y: 0.7 }
	});

	// Right cannon
	confetti({
		particleCount: 80,
		angle: 120,
		spread: 55,
		origin: { x: 1, y: 0.7 }
	});
}

/**
 * Pride rainbow colors
 */
function prideConfetti() {
	const colors = ['#e81416', '#ffa500', '#faeb36', '#79c314', '#487de7', '#70369d'];

	confetti({
		particleCount: 100,
		spread: 100,
		origin: { y: 0.6 },
		colors
	});

	setTimeout(() => {
		confetti({
			particleCount: 50,
			angle: 60,
			spread: 60,
			origin: { x: 0, y: 0.7 },
			colors
		});
		confetti({
			particleCount: 50,
			angle: 120,
			spread: 60,
			origin: { x: 1, y: 0.7 },
			colors
		});
	}, 200);
}

/**
 * Big central explosion
 */
function explosionConfetti() {
	const count = 200;
	const defaults = {
		origin: { y: 0.5 },
		ticks: 150
	};

	function fire(particleRatio: number, opts: confetti.Options) {
		confetti({
			...defaults,
			...opts,
			particleCount: Math.floor(count * particleRatio)
		});
	}

	fire(0.25, {
		spread: 26,
		startVelocity: 55
	});
	fire(0.2, {
		spread: 60
	});
	fire(0.35, {
		spread: 100,
		decay: 0.91,
		scalar: 0.8
	});
	fire(0.1, {
		spread: 120,
		startVelocity: 25,
		decay: 0.92,
		scalar: 1.2
	});
	fire(0.1, {
		spread: 120,
		startVelocity: 45
	});
}

/**
 * Gentle shower from top
 */
function showerConfetti() {
	const duration = 2500;
	const end = Date.now() + duration;

	const frame = () => {
		if (Date.now() > end) return;

		confetti({
			particleCount: 5,
			startVelocity: 10,
			ticks: 150,
			origin: {
				x: Math.random(),
				y: 0
			},
			gravity: 0.8,
			spread: 20
		});

		requestAnimationFrame(frame);
	};

	frame();
}

/**
 * Trigger a random celebration effect
 */
export function celebrate(): CelebrationType {
	const type = celebrationTypes[Math.floor(Math.random() * celebrationTypes.length)];

	switch (type) {
		case 'classic':
			classicConfetti();
			break;
		case 'fireworks':
			fireworksConfetti();
			break;
		case 'stars':
			starsConfetti();
			break;
		case 'snow':
			snowConfetti();
			break;
		case 'cannon':
			cannonConfetti();
			break;
		case 'pride':
			prideConfetti();
			break;
		case 'explosion':
			explosionConfetti();
			break;
		case 'shower':
			showerConfetti();
			break;
	}

	return type;
}

/**
 * Trigger a specific celebration type
 */
export function celebrateWith(type: CelebrationType): void {
	switch (type) {
		case 'classic':
			classicConfetti();
			break;
		case 'fireworks':
			fireworksConfetti();
			break;
		case 'stars':
			starsConfetti();
			break;
		case 'snow':
			snowConfetti();
			break;
		case 'cannon':
			cannonConfetti();
			break;
		case 'pride':
			prideConfetti();
			break;
		case 'explosion':
			explosionConfetti();
			break;
		case 'shower':
			showerConfetti();
			break;
	}
}
