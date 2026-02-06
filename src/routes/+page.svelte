<script lang="ts">
	import { onDestroy } from 'svelte';
	import {
		timer,
		stats,
		settings,
		getNextDuration,
		taskStats,
		taskHistory
	} from '$lib/stores/timer';
	import { playSound } from '$lib/utils/audio';
	import { celebrate } from '$lib/utils/celebration';
	import Timer from '$lib/components/Timer.svelte';
	import DurationPicker from '$lib/components/DurationPicker.svelte';
	import TaskInput from '$lib/components/TaskInput.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';

	let settingsOpen = $state(false);
	let hasPlayedSound = $state(false);
	let pendingNextDuration = $state<number | null>(null);

	const timerState = $derived($timer);
	const currentSettings = $derived($settings);

	// Watch for completion: play sound, record stats, and handle transitions
	$effect(() => {
		if (timerState.isComplete && !hasPlayedSound) {
			if (currentSettings.soundEnabled) {
				playSound(currentSettings.selectedSound);
			}

			// Only record stats and celebrate for focus sessions, not cooldowns
			if (!timerState.isCooldown) {
				stats.recordCompletion(timerState.selectedDuration);
				// Record task stats and add to history
				if (timerState.taskName.trim()) {
					taskStats.recordMinutes(timerState.taskName, timerState.selectedDuration);
					taskHistory.addTask(timerState.taskName);
				}
				// Celebrate with random confetti!
				celebrate();
			}
			hasPlayedSound = true;

			// Handle automatic transitions
			if (timerState.isCooldown) {
				// Cooldown just completed - advance to next focus duration
				if (currentSettings.autoStart && pendingNextDuration !== null) {
					setTimeout(() => {
						timer.selectDuration(pendingNextDuration!);
						pendingNextDuration = null;
						timer.start();
					}, 1500);
				}
			} else {
				// Focus session completed
				const nextDuration = getNextDuration(
					timerState.selectedDuration,
					currentSettings.gradations
				);
				pendingNextDuration = nextDuration;

				if (currentSettings.cooldownEnabled) {
					// Start cooldown
					setTimeout(() => {
						timer.startCooldown(currentSettings.cooldownDuration);
						if (currentSettings.cooldownAutoStart) {
							timer.start();
						}
					}, 1500);
				} else if (currentSettings.autoStart) {
					// No cooldown, just auto-start next timer
					setTimeout(() => {
						timer.selectDuration(nextDuration);
						pendingNextDuration = null;
						timer.start();
					}, 1500);
				}
			}
		}
		if (!timerState.isComplete) {
			hasPlayedSound = false;
		}
	});

	function handleStart() {
		timer.start();
	}

	function handlePause() {
		timer.pause();
	}

	function handleReset() {
		timer.reset();
	}

	function handleDone() {
		if (timerState.isCooldown) {
			// Cooldown done - advance to next focus duration
			if (pendingNextDuration !== null) {
				timer.selectDuration(pendingNextDuration);
				pendingNextDuration = null;
			} else {
				timer.endCooldown();
			}
		} else {
			// Focus session done - start cooldown or advance
			const nextDuration = getNextDuration(timerState.selectedDuration, currentSettings.gradations);
			pendingNextDuration = nextDuration;

			if (currentSettings.cooldownEnabled) {
				timer.startCooldown(currentSettings.cooldownDuration);
			} else {
				timer.selectDuration(nextDuration);
				pendingNextDuration = null;
			}
		}
	}

	function handleSkipCooldown() {
		if (pendingNextDuration !== null) {
			timer.selectDuration(pendingNextDuration);
			pendingNextDuration = null;
		} else {
			timer.endCooldown();
		}
	}

	onDestroy(() => {
		timer.cleanup();
	});

	// Rest messages for cooldown
	const restMessages = [
		'Take a breath. You earned this.',
		'Step away from the screen.',
		'Stretch, hydrate, reset.',
		'Let your mind wander.',
		'Rest is productive too.'
	];
	const randomRestMessage = restMessages[Math.floor(Math.random() * restMessages.length)];
</script>

<div class="app">
	<header class="header">
		<div class="logo">
			<svg class="logo-icon" width="28" height="28" viewBox="0 0 28 28" fill="none">
				<circle cx="14" cy="14" r="12" stroke="currentColor" stroke-width="2.5" />
				<path
					d="M14 8V14L18 16"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			<span class="logo-text">Clock In</span>
		</div>
		<button class="settings-btn" onclick={() => (settingsOpen = true)} aria-label="Open settings">
			<svg width="22" height="22" viewBox="0 0 22 22" fill="none">
				<path
					d="M11 14C12.6569 14 14 12.6569 14 11C14 9.34315 12.6569 8 11 8C9.34315 8 8 9.34315 8 11C8 12.6569 9.34315 14 11 14Z"
					stroke="currentColor"
					stroke-width="1.5"
				/>
				<path
					d="M17.7273 13.7273C17.6063 14.0015 17.5702 14.3056 17.6236 14.6005C17.6771 14.8954 17.8177 15.1676 18.0273 15.3818L18.0818 15.4364C18.2509 15.6052 18.385 15.8057 18.4765 16.0265C18.568 16.2472 18.6151 16.4838 18.6151 16.7227C18.6151 16.9617 18.568 17.1983 18.4765 17.419C18.385 17.6397 18.2509 17.8402 18.0818 18.0091C17.9129 18.1781 17.7124 18.3122 17.4917 18.4037C17.271 18.4952 17.0344 18.5423 16.7955 18.5423C16.5565 18.5423 16.3199 18.4952 16.0992 18.4037C15.8785 18.3122 15.678 18.1781 15.5091 18.0091L15.4545 17.9545C15.2403 17.745 14.9682 17.6044 14.6733 17.5509C14.3784 17.4974 14.0742 17.5335 13.8 17.6545C13.5311 17.7698 13.3018 17.9611 13.1403 18.205C12.9788 18.4489 12.8921 18.7347 12.8909 19.0273V19.1818C12.8909 19.664 12.6994 20.1265 12.3584 20.4675C12.0174 20.8084 11.5549 21 11.0727 21C10.5905 21 10.1281 20.8084 9.78708 20.4675C9.44608 20.1265 9.25455 19.664 9.25455 19.1818V19.1C9.24751 18.7991 9.15011 18.5073 8.97501 18.2625C8.79991 18.0176 8.55521 17.8312 8.27273 17.7273C7.99853 17.6063 7.69437 17.5702 7.39947 17.6236C7.10456 17.6771 6.83244 17.8177 6.61818 18.0273L6.56364 18.0818C6.39478 18.2509 6.19425 18.385 5.97353 18.4765C5.7528 18.568 5.51621 18.6151 5.27727 18.6151C5.03834 18.6151 4.80175 18.568 4.58102 18.4765C4.36029 18.385 4.15977 18.2509 3.99091 18.0818C3.82186 17.9129 3.68775 17.7124 3.59626 17.4917C3.50476 17.271 3.45766 17.0344 3.45766 16.7955C3.45766 16.5565 3.50476 16.3199 3.59626 16.0992C3.68775 15.8785 3.82186 15.678 3.99091 15.5091L4.04545 15.4545C4.25503 15.2403 4.39562 14.9682 4.4491 14.6733C4.50257 14.3784 4.46647 14.0742 4.34545 13.8C4.23022 13.5311 4.03887 13.3018 3.79497 13.1403C3.55107 12.9788 3.26526 12.8921 2.97273 12.8909H2.81818C2.33597 12.8909 1.87351 12.6994 1.53253 12.3584C1.19156 12.0174 1 11.5549 1 11.0727C1 10.5905 1.19156 10.1281 1.53253 9.78708C1.87351 9.44608 2.33597 9.25455 2.81818 9.25455H2.9C3.20094 9.24751 3.49273 9.15011 3.73754 8.97501C3.98236 8.79991 4.16883 8.55521 4.27273 8.27273C4.39374 7.99853 4.42984 7.69437 4.37637 7.39947C4.3229 7.10456 4.18231 6.83244 3.97273 6.61818L3.91818 6.56364C3.74913 6.39478 3.61503 6.19425 3.52353 5.97353C3.43203 5.7528 3.38493 5.51621 3.38493 5.27727C3.38493 5.03834 3.43203 4.80175 3.52353 4.58102C3.61503 4.36029 3.74913 4.15977 3.91818 3.99091C4.08704 3.82186 4.28757 3.68775 4.50829 3.59626C4.72902 3.50476 4.96561 3.45766 5.20455 3.45766C5.44348 3.45766 5.68007 3.50476 5.9008 3.59626C6.12152 3.68775 6.32205 3.82186 6.49091 3.99091L6.54545 4.04545C6.75971 4.25503 7.03183 4.39562 7.32674 4.4491C7.62164 4.50257 7.9258 4.46647 8.2 4.34545H8.27273C8.54161 4.23022 8.77093 4.03887 8.93245 3.79497C9.09397 3.55107 9.18065 3.26526 9.18182 2.97273V2.81818C9.18182 2.33597 9.37338 1.87351 9.71435 1.53253C10.0553 1.19156 10.5178 1 11 1C11.4822 1 11.9447 1.19156 12.2856 1.53253C12.6266 1.87351 12.8182 2.33597 12.8182 2.81818V2.9C12.8193 3.19253 12.906 3.47834 13.0676 3.72224C13.2291 3.96614 13.4584 4.15749 13.7273 4.27273C14.0015 4.39374 14.3056 4.42984 14.6005 4.37637C14.8954 4.3229 15.1676 4.18231 15.3818 3.97273L15.4364 3.91818C15.6052 3.74913 15.8057 3.61503 16.0265 3.52353C16.2472 3.43203 16.4838 3.38493 16.7227 3.38493C16.9617 3.38493 17.1983 3.43203 17.419 3.52353C17.6397 3.61503 17.8402 3.74913 18.0091 3.91818C18.1781 4.08704 18.3122 4.28757 18.4037 4.50829C18.4952 4.72902 18.5423 4.96561 18.5423 5.20455C18.5423 5.44348 18.4952 5.68007 18.4037 5.9008C18.3122 6.12152 18.1781 6.32205 18.0091 6.49091L17.9545 6.54545C17.745 6.75971 17.6044 7.03183 17.5509 7.32674C17.4974 7.62164 17.5335 7.9258 17.6545 8.2V8.27273C17.7698 8.54161 17.9611 8.77093 18.205 8.93245C18.4489 9.09397 18.7347 9.18065 19.0273 9.18182H19.1818C19.664 9.18182 20.1265 9.37338 20.4675 9.71435C20.8084 10.0553 21 10.5178 21 11C21 11.4822 20.8084 11.9447 20.4675 12.2856C20.1265 12.6266 19.664 12.8182 19.1818 12.8182H19.1C18.8075 12.8193 18.5217 12.906 18.2778 13.0676C18.0339 13.2291 17.8425 13.4584 17.7273 13.7273Z"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>
	</header>

	<main class="main">
		{#if timerState.isCooldown}
			<div class="cooldown-message">
				<p class="cooldown-title">Rest Time</p>
				<p class="cooldown-hint">{randomRestMessage}</p>
			</div>
		{:else}
			<TaskInput />
		{/if}

		<div class="timer-wrapper">
			<Timer isComplete={timerState.isComplete} isCooldown={timerState.isCooldown} />
		</div>

		{#if !timerState.isCooldown}
			<DurationPicker />
		{/if}

		<div class="controls">
			{#if timerState.isComplete}
				<button
					class="btn btn-primary"
					class:btn-cooldown={timerState.isCooldown}
					onclick={handleDone}
				>
					{timerState.isCooldown ? 'Continue' : 'Done'}
				</button>
			{:else if timerState.isRunning}
				<button
					class="btn btn-primary"
					class:btn-cooldown={timerState.isCooldown}
					onclick={handlePause}
				>
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<rect x="5" y="4" width="3" height="12" rx="1" fill="currentColor" />
						<rect x="12" y="4" width="3" height="12" rx="1" fill="currentColor" />
					</svg>
					Pause
				</button>
				{#if timerState.isCooldown}
					<button class="btn btn-secondary" onclick={handleSkipCooldown}>Skip Rest</button>
				{:else}
					<button class="btn btn-secondary" onclick={handleReset}>Reset</button>
				{/if}
			{:else}
				<button
					class="btn btn-primary"
					class:btn-cooldown={timerState.isCooldown}
					onclick={handleStart}
				>
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<path d="M6 4L16 10L6 16V4Z" fill="currentColor" />
					</svg>
					{#if timerState.isCooldown}
						{timerState.remainingSeconds < timerState.selectedDuration * 60
							? 'Resume Rest'
							: 'Start Rest'}
					{:else}
						{timerState.remainingSeconds < timerState.selectedDuration * 60 ? 'Resume' : 'Start'}
					{/if}
				</button>
				{#if timerState.isCooldown}
					<button class="btn btn-secondary" onclick={handleSkipCooldown}>Skip Rest</button>
				{:else if timerState.remainingSeconds < timerState.selectedDuration * 60}
					<button class="btn btn-secondary" onclick={handleReset}>Reset</button>
				{/if}
			{/if}
		</div>
	</main>

	<footer class="footer">
		<p>Focus. One step at a time.</p>
	</footer>
</div>

<SettingsModal isOpen={settingsOpen} onClose={() => (settingsOpen = false)} />

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		padding: 1rem;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.5rem 1.5rem;
		max-width: 600px;
		width: 100%;
		margin: 0 auto;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		color: var(--color-coral-500);
	}

	.logo-icon {
		flex-shrink: 0;
	}

	.logo-text {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 1.25rem;
		letter-spacing: -0.02em;
	}

	.settings-btn {
		background: white;
		border: none;
		padding: 0.625rem;
		border-radius: 12px;
		cursor: pointer;
		color: var(--color-warm-gray-500);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		transition: all 0.2s;
	}

	.settings-btn:hover {
		color: var(--color-warm-gray-700);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	.main {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		padding: 1rem 0;
		max-width: 600px;
		width: 100%;
		margin: 0 auto;
	}

	.timer-wrapper {
		padding: 1rem 0;
	}

	.controls {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.footer {
		text-align: center;
		padding: 1.5rem 0;
		color: var(--color-warm-gray-400);
		font-size: 0.8125rem;
	}

	.footer p {
		margin: 0;
	}

	/* Cooldown message styles */
	.cooldown-message {
		text-align: center;
		padding: 1rem;
	}

	.cooldown-title {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-cooldown);
		margin: 0 0 0.5rem;
	}

	.cooldown-hint {
		font-size: 0.9375rem;
		color: var(--color-warm-gray-500);
		margin: 0;
		font-style: italic;
	}

	/* Button styles scoped to this page */
	.btn {
		font-family: var(--font-display);
		font-weight: 600;
		border: none;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.btn:focus-visible {
		outline: 2px solid var(--color-coral-500);
		outline-offset: 2px;
	}

	.btn-primary {
		background: var(--color-coral-500);
		color: white;
		padding: 1rem 2.5rem;
		border-radius: 9999px;
		font-size: 1.125rem;
		box-shadow: 0 4px 24px rgba(224, 123, 103, 0.25);
	}

	.btn-primary:hover {
		background: var(--color-coral-600);
		transform: translateY(-1px);
		box-shadow: 0 6px 28px rgba(224, 123, 103, 0.3);
	}

	.btn-primary:active {
		transform: translateY(0);
	}

	.btn-primary.btn-cooldown {
		background: var(--color-cooldown);
		box-shadow: 0 4px 24px rgba(91, 155, 213, 0.25);
	}

	.btn-primary.btn-cooldown:hover {
		background: var(--color-cooldown-dark);
		box-shadow: 0 6px 28px rgba(91, 155, 213, 0.3);
	}

	.btn-primary.btn-cooldown:focus-visible {
		outline-color: var(--color-cooldown);
	}

	.btn-secondary {
		background: white;
		color: var(--color-warm-gray-700);
		padding: 1rem 1.75rem;
		border-radius: 9999px;
		font-size: 1rem;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
		border: 1px solid var(--color-warm-gray-200);
	}

	.btn-secondary:hover {
		background: var(--color-cream-100);
		border-color: var(--color-coral-300);
	}

	@media (max-width: 480px) {
		.main {
			gap: 1.5rem;
		}

		.btn-primary {
			padding: 0.875rem 2rem;
			font-size: 1rem;
		}

		.btn-secondary {
			padding: 0.875rem 1.5rem;
		}
	}
</style>
