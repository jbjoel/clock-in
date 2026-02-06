<script lang="ts">
	import { timer, formattedTime, progress } from '$lib/stores/timer';

	const { isComplete = false, isCooldown = false } = $props<{
		isComplete?: boolean;
		isCooldown?: boolean;
	}>();

	const circumference = 2 * Math.PI * 140;
	const strokeDashoffset = $derived(circumference - ($progress / 100) * circumference);

	// Determine stroke color based on state
	const strokeColor = $derived(() => {
		if (isComplete) return 'var(--color-success)';
		if (isCooldown) return 'var(--color-cooldown)';
		return 'var(--color-coral-500)';
	});
</script>

<div class="timer-container" class:timer-complete={isComplete} class:timer-cooldown={isCooldown}>
	<svg class="progress-ring" width="320" height="320" viewBox="0 0 320 320">
		<!-- Background circle -->
		<circle
			class="progress-ring-bg"
			cx="160"
			cy="160"
			r="140"
			fill="none"
			stroke={isCooldown ? 'var(--color-cooldown-light)' : 'var(--color-warm-gray-200)'}
			stroke-width="8"
		/>
		<!-- Progress circle -->
		<circle
			class="progress-ring-circle"
			cx="160"
			cy="160"
			r="140"
			fill="none"
			stroke={strokeColor()}
			stroke-width="8"
			stroke-dasharray={circumference}
			stroke-dashoffset={strokeDashoffset}
		/>
	</svg>
	<div class="timer-text">
		<span class="timer-display">{$formattedTime}</span>
		{#if isCooldown}
			{#if $timer.isRunning}
				<span class="timer-status cooldown">resting...</span>
			{:else if isComplete}
				<span class="timer-status success">rest complete!</span>
			{:else}
				<span class="timer-status cooldown">time to rest</span>
			{/if}
		{:else if $timer.isRunning}
			<span class="timer-status">focusing...</span>
		{:else if isComplete}
			<span class="timer-status success">complete!</span>
		{:else}
			<span class="timer-status">ready</span>
		{/if}
	</div>
</div>

<style>
	.timer-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 320px;
		height: 320px;
	}

	.progress-ring {
		position: absolute;
		transform: rotate(-90deg);
	}

	.progress-ring-bg {
		opacity: 0.5;
	}

	.progress-ring-circle {
		transition: stroke-dashoffset 0.35s cubic-bezier(0.4, 0, 0.2, 1);
		stroke-linecap: round;
	}

	.timer-text {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		z-index: 1;
	}

	.timer-display {
		font-family: var(--font-mono);
		font-weight: 700;
		font-size: 4rem;
		line-height: 1;
		letter-spacing: -0.02em;
		color: var(--color-warm-gray-800);
	}

	.timer-status {
		font-family: var(--font-display);
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-warm-gray-400);
		text-transform: lowercase;
		letter-spacing: 0.05em;
	}

	.timer-status.success {
		color: var(--color-success);
		font-weight: 600;
	}

	.timer-status.cooldown {
		color: var(--color-cooldown);
		font-weight: 500;
	}

	.timer-complete .timer-display {
		color: var(--color-success);
	}

	.timer-cooldown .timer-display {
		color: var(--color-cooldown);
	}

	.timer-complete {
		animation: celebrate 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	@keyframes celebrate {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.03);
		}
		100% {
			transform: scale(1);
		}
	}

	@media (max-width: 400px) {
		.timer-container {
			width: 280px;
			height: 280px;
		}

		.timer-display {
			font-size: 3rem;
		}
	}
</style>
