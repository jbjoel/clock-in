<script lang="ts">
	import { timer, settings, stats } from '$lib/stores/timer';

	const selectedDuration = $derived($timer.selectedDuration);
	const gradations = $derived($settings.gradations);
	const completionStats = $derived($stats);

	function selectDuration(minutes: number) {
		timer.selectDuration(minutes);
	}

	function isCompleted(duration: number): boolean {
		return (completionStats[duration] || 0) > 0;
	}

	function getCompletionCount(duration: number): number {
		return completionStats[duration] || 0;
	}
</script>

<div class="duration-picker">
	{#each gradations as duration (duration)}
		{@const completed = isCompleted(duration)}
		{@const count = getCompletionCount(duration)}
		<button
			class="duration-pill"
			class:selected={selectedDuration === duration}
			class:completed={completed && selectedDuration !== duration}
			class:uncompleted={!completed && selectedDuration !== duration}
			onclick={() => selectDuration(duration)}
			aria-pressed={selectedDuration === duration}
		>
			<span class="duration-value">{duration}</span>
			<span class="duration-unit">min</span>
			{#if completed && selectedDuration !== duration}
				<span class="completion-badge" title="{count} completed">
					<svg width="10" height="10" viewBox="0 0 10 10" fill="none">
						<path d="M2 5L4 7L8 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</span>
			{/if}
			{#if count > 1}
				<span class="count-badge">{count}</span>
			{/if}
		</button>
	{/each}
</div>

<style>
	.duration-picker {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		justify-content: center;
		padding: 0.5rem;
	}

	.duration-pill {
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 0.9375rem;
		padding: 0.75rem 1.25rem;
		border-radius: 9999px;
		border: 2px solid var(--color-warm-gray-200);
		background: white;
		color: var(--color-warm-gray-600);
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.duration-pill:hover {
		border-color: var(--color-coral-300);
		color: var(--color-coral-600);
		transform: translateY(-1px);
	}

	.duration-pill.selected {
		border-color: var(--color-coral-500);
		background: var(--color-coral-500);
		color: white;
		box-shadow: 0 4px 24px rgba(224, 123, 103, 0.25);
	}

	.duration-pill.selected:hover {
		background: var(--color-coral-600);
		border-color: var(--color-coral-600);
		color: white;
	}

	.duration-pill.completed {
		border-color: var(--color-success);
		background: var(--color-success-soft);
		color: var(--color-warm-gray-700);
	}

	.duration-pill.completed:hover {
		border-color: var(--color-success);
		background: rgba(107, 191, 138, 0.2);
	}

	.duration-pill.uncompleted {
		opacity: 0.65;
	}

	.duration-pill.uncompleted:hover {
		opacity: 1;
	}

	.duration-value {
		font-weight: 700;
	}

	.duration-unit {
		font-weight: 500;
		opacity: 0.8;
	}

	.completion-badge {
		position: absolute;
		top: -4px;
		right: -4px;
		width: 18px;
		height: 18px;
		background: var(--color-success);
		color: white;
		border-radius: 50%;
		border: 2px solid white;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.count-badge {
		position: absolute;
		bottom: -6px;
		right: 50%;
		transform: translateX(50%);
		background: var(--color-warm-gray-600);
		color: white;
		font-size: 0.625rem;
		font-weight: 700;
		padding: 0.125rem 0.375rem;
		border-radius: 9999px;
		min-width: 1rem;
		text-align: center;
		border: 2px solid white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.duration-pill.selected .count-badge {
		background: white;
		color: var(--color-coral-500);
	}

	.duration-pill.completed .count-badge {
		background: var(--color-success);
	}
</style>
