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
			class="pill"
			class:selected={selectedDuration === duration}
			class:completed={completed && selectedDuration !== duration}
			class:uncompleted={!completed && selectedDuration !== duration}
			onclick={() => selectDuration(duration)}
			aria-pressed={selectedDuration === duration}
		>
			<span class="pill-value">{duration}</span>
			<span class="pill-unit">m</span>
			{#if count > 0 && selectedDuration !== duration}
				<span class="pill-count">{count}</span>
			{/if}
		</button>
	{/each}
</div>

<style>
	.duration-picker {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		justify-content: center;
		padding: 0.25rem;
	}

	.pill {
		font-family: var(--font-body);
		font-weight: 600;
		font-size: 0.8125rem;
		padding: 0.5rem 0.875rem;
		border-radius: var(--radius-full);
		border: 1.5px solid var(--color-border-strong);
		background: white;
		color: var(--color-ink-muted);
		cursor: pointer;
		transition: all 0.2s var(--ease-out);
		position: relative;
		display: inline-flex;
		align-items: baseline;
		gap: 0.125rem;
	}

	.pill:hover {
		border-color: var(--color-ember);
		color: var(--color-ember);
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}

	.pill.selected {
		border-color: var(--color-ink);
		background: var(--color-ink);
		color: var(--color-paper);
		box-shadow: var(--shadow-md);
		transform: translateY(-1px);
	}

	.pill.selected:hover {
		background: var(--color-ink-soft);
		border-color: var(--color-ink-soft);
	}

	.pill.completed {
		border-color: var(--color-sage);
		background: var(--color-sage-light);
		color: var(--color-ink-soft);
	}

	.pill.completed:hover {
		border-color: var(--color-sage);
		box-shadow: 0 2px 8px var(--color-sage-glow);
	}

	.pill.uncompleted {
		opacity: 0.5;
	}

	.pill.uncompleted:hover {
		opacity: 1;
	}

	.pill-value {
		font-weight: 700;
		font-size: 0.875rem;
	}

	.pill-unit {
		font-weight: 500;
		opacity: 0.6;
		font-size: 0.75rem;
	}

	.pill-count {
		position: absolute;
		top: -5px;
		right: -5px;
		background: var(--color-ink-muted);
		color: white;
		font-size: 0.5625rem;
		font-weight: 700;
		width: 16px;
		height: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		border: 2px solid white;
		box-shadow: var(--shadow-xs);
	}

	.pill.selected .pill-count {
		background: var(--color-ember);
	}

	.pill.completed .pill-count {
		background: var(--color-sage);
	}
</style>
