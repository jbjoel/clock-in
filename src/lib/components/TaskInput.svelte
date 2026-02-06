<script lang="ts">
	import { timer, taskHistory, taskStats } from '$lib/stores/timer';

	const taskName = $derived($timer.taskName);
	const history = $derived($taskHistory);
	const stats = $derived($taskStats);

	let showDropdown = $state(false);
	let inputElement: HTMLInputElement | undefined = $state();

	// Filter history based on current input
	const filteredHistory = $derived(() => {
		if (!taskName.trim()) return history;
		const lower = taskName.toLowerCase();
		return history.filter((t) => t.toLowerCase().includes(lower));
	});

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		timer.setTaskName(target.value);
		showDropdown = true;
	}

	function handleFocus() {
		showDropdown = true;
	}

	function handleBlur() {
		// Delay to allow click on dropdown item
		setTimeout(() => {
			showDropdown = false;
		}, 150);
	}

	function selectTask(task: string) {
		timer.setTaskName(task);
		showDropdown = false;
		inputElement?.blur();
	}

	function formatMinutes(minutes: number): string {
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}
</script>

<div class="task-input-container">
	<div class="input-wrapper">
		<input
			bind:this={inputElement}
			type="text"
			class="input-field task-input"
			placeholder="What are you focusing on?"
			value={taskName}
			oninput={handleInput}
			onfocus={handleFocus}
			onblur={handleBlur}
			maxlength="100"
			autocomplete="off"
		/>
		{#if history.length > 0}
			<button
				class="dropdown-trigger"
				onclick={() => {
					showDropdown = !showDropdown;
					if (showDropdown) inputElement?.focus();
				}}
				aria-label="Show recent tasks"
				type="button"
			>
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<path
						d="M4 6L8 10L12 6"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		{/if}
	</div>

	{#if showDropdown && filteredHistory().length > 0}
		<div class="dropdown">
			{#each filteredHistory() as task (task)}
				<button class="dropdown-item" onmousedown={() => selectTask(task)} type="button">
					<span class="task-name">{task}</span>
					{#if stats[task]}
						<span class="task-stats">{formatMinutes(stats[task])}</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.task-input-container {
		width: 100%;
		max-width: 360px;
		position: relative;
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.task-input {
		font-family: var(--font-display);
		font-size: 1rem;
		padding: 0.875rem 2.5rem 0.875rem 1.25rem;
		border: 2px solid var(--color-warm-gray-200);
		border-radius: 16px;
		background: white;
		color: var(--color-warm-gray-800);
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		width: 100%;
		text-align: center;
	}

	.task-input::placeholder {
		color: var(--color-warm-gray-400);
	}

	.task-input:focus {
		outline: none;
		border-color: var(--color-coral-400);
		box-shadow: 0 0 0 3px rgba(224, 123, 103, 0.15);
	}

	.dropdown-trigger {
		position: absolute;
		right: 0.75rem;
		background: none;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		color: var(--color-warm-gray-400);
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		transition: all 0.15s;
	}

	.dropdown-trigger:hover {
		color: var(--color-warm-gray-600);
		background: var(--color-warm-gray-100);
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		background: white;
		border: 2px solid var(--color-warm-gray-200);
		border-radius: 12px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
		z-index: 50;
		max-height: 240px;
		overflow-y: auto;
	}

	.dropdown-item {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		font-family: var(--font-display);
		font-size: 0.875rem;
		color: var(--color-warm-gray-700);
		transition: background 0.15s;
	}

	.dropdown-item:first-child {
		border-radius: 10px 10px 0 0;
	}

	.dropdown-item:last-child {
		border-radius: 0 0 10px 10px;
	}

	.dropdown-item:only-child {
		border-radius: 10px;
	}

	.dropdown-item:hover {
		background: var(--color-warm-gray-50);
	}

	.task-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.task-stats {
		font-size: 0.75rem;
		color: var(--color-coral-500);
		font-weight: 600;
		flex-shrink: 0;
	}
</style>
