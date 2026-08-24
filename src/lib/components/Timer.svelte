<script lang="ts">
	import { timer, formattedTime, progress } from '$lib/stores/timer';

	const { isComplete = false, isCooldown = false } = $props<{
		isComplete?: boolean;
		isCooldown?: boolean;
	}>();

	const circumference = 2 * Math.PI * 130;
	const strokeDashoffset = $derived(circumference - ($progress / 100) * circumference);

	const strokeColor = $derived.by(() => {
		if (isComplete) return 'var(--color-sage)';
		if (isCooldown) return 'var(--color-stone)';
		return 'var(--color-ember)';
	});

	const bgStroke = $derived.by(() => {
		if (isCooldown) return 'var(--color-stone-light)';
		return 'var(--color-paper-deep)';
	});
</script>

<div class="timer-container" class:timer-complete={isComplete} class:timer-cooldown={isCooldown}>
	<div class="timer-ring-wrapper">
		<!-- Outer decorative ring -->
		<svg class="ring-decoration" width="300" height="300" viewBox="0 0 300 300">
			<circle
				cx="150"
				cy="150"
				r="145"
				fill="none"
				stroke="var(--color-border)"
				stroke-width="1"
			/>
			<!-- Tick marks -->
			{#each Array(60) as _, i}
				<line
					x1="150"
					y1={i % 5 === 0 ? 10 : 14}
					x2="150"
					y2={i % 5 === 0 ? 20 : 18}
					stroke={i % 5 === 0 ? 'var(--color-ink-faint)' : 'var(--color-border-strong)'}
					stroke-width={i % 5 === 0 ? 1.5 : 0.75}
					transform="rotate({i * 6} 150 150)"
				/>
			{/each}
		</svg>

		<!-- Progress ring -->
		<svg class="progress-ring" width="300" height="300" viewBox="0 0 300 300">
			<circle
				class="progress-ring-bg"
				cx="150"
				cy="150"
				r="130"
				fill="none"
				stroke={bgStroke}
				stroke-width="6"
			/>
			<circle
				class="progress-ring-circle"
				cx="150"
				cy="150"
				r="130"
				fill="none"
				stroke={strokeColor}
				stroke-width="6"
				stroke-dasharray={circumference}
				stroke-dashoffset={strokeDashoffset}
			/>
		</svg>
	</div>

	<div class="timer-text">
		<span class="timer-display" class:complete={isComplete} class:cooldown={isCooldown}>
			{$formattedTime}
		</span>
		<span class="timer-status" class:success={isComplete && !isCooldown} class:cooldown={isCooldown}>
			{#if isCooldown}
				{#if $timer.isRunning}resting{:else if isComplete}rested{:else}rest{/if}
			{:else if $timer.isRunning}
				focusing
			{:else if isComplete}
				done
			{:else}
				ready
			{/if}
		</span>
	</div>
</div>

<style>
	.timer-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 300px;
		height: 300px;
	}

	.timer-ring-wrapper {
		position: absolute;
		inset: 0;
	}

	.ring-decoration {
		position: absolute;
		inset: 0;
		opacity: 0.7;
	}

	.progress-ring {
		position: absolute;
		inset: 0;
		transform: rotate(-90deg);
	}

	.progress-ring-bg {
		opacity: 0.4;
	}

	.progress-ring-circle {
		transition: stroke-dashoffset 0.5s cubic-bezier(0.16, 1, 0.3, 1);
		stroke-linecap: round;
		filter: drop-shadow(0 0 6px var(--color-ember-glow));
	}

	.timer-text {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		z-index: 1;
	}

	.timer-display {
		font-family: var(--font-mono);
		font-weight: 700;
		font-size: 3.5rem;
		line-height: 1;
		letter-spacing: -0.04em;
		color: var(--color-ink);
		transition: color 0.3s var(--ease-out);
	}

	.timer-display.complete {
		color: var(--color-sage);
	}

	.timer-display.cooldown {
		color: var(--color-stone);
	}

	.timer-status {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-ink-faint);
		text-transform: uppercase;
		letter-spacing: 0.12em;
	}

	.timer-status.success {
		color: var(--color-sage);
	}

	.timer-status.cooldown {
		color: var(--color-stone);
	}

	.timer-complete {
		animation: celebrate 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	@keyframes celebrate {
		0% { transform: scale(1); }
		50% { transform: scale(1.03); }
		100% { transform: scale(1); }
	}

	@media (max-width: 400px) {
		.timer-container {
			width: 260px;
			height: 260px;
		}

		.ring-decoration,
		.progress-ring {
			width: 260px;
			height: 260px;
		}

		.timer-display {
			font-size: 2.75rem;
		}
	}
</style>
