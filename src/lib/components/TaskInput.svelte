<script lang="ts">
	import { timer, taskHistory, taskStats } from '$lib/stores/timer';
	import { getAutocompleteSuggestions, formatMinutes } from '$lib/utils/taskTree';

	const taskName = $derived($timer.taskName);
	const history = $derived($taskHistory);
	const stats = $derived($taskStats);

	let showDropdown = $state(false);
	let inputElement: HTMLInputElement | undefined = $state();
	let selectedIndex = $state(-1);

	// Path-aware suggestions
	const suggestions = $derived.by(() => {
		return getAutocompleteSuggestions(taskName, history, stats);
	});

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		timer.setTaskName(target.value);
		showDropdown = true;
		selectedIndex = -1;
	}

	function handleFocus() {
		showDropdown = true;
	}

	function handleBlur() {
		setTimeout(() => {
			showDropdown = false;
			selectedIndex = -1;
		}, 150);
	}

	function selectTask(task: string, isFolder: boolean) {
		if (isFolder) {
			// Navigate into folder
			timer.setTaskName(task + '/');
			showDropdown = true;
			selectedIndex = -1;
			inputElement?.focus();
		} else {
			timer.setTaskName(task);
			showDropdown = false;
			inputElement?.blur();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!showDropdown || suggestions.length === 0) return;

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, -1);
		} else if (event.key === 'Tab' && selectedIndex >= 0) {
			event.preventDefault();
			const item = suggestions[selectedIndex];
			selectTask(item.path, item.isFolder);
		} else if (event.key === 'Enter' && selectedIndex >= 0) {
			event.preventDefault();
			const item = suggestions[selectedIndex];
			timer.setTaskName(item.path);
			showDropdown = false;
		} else if (event.key === 'Escape') {
			showDropdown = false;
			selectedIndex = -1;
		}
	}

	// Breadcrumb segments from current input
	const breadcrumbs = $derived.by(() => {
		const trimmed = taskName.trim();
		if (!trimmed.includes('/')) return [];
		const parts = trimmed.split('/');
		// Show all but the last segment as breadcrumbs
		return parts.slice(0, -1).map((part, i) => ({
			label: part,
			path: parts.slice(0, i + 1).join('/')
		}));
	});
</script>

<div class="task-input-container">
	{#if breadcrumbs.length > 0}
		<div class="breadcrumbs">
			<button
				class="breadcrumb-item breadcrumb-root"
				onmousedown={() => {
					timer.setTaskName('');
					showDropdown = true;
					inputElement?.focus();
				}}
				type="button"
			>
				All
			</button>
			{#each breadcrumbs as crumb (crumb.path)}
				<span class="breadcrumb-sep">/</span>
				<button
					class="breadcrumb-item"
					onmousedown={() => {
						timer.setTaskName(crumb.path + '/');
						showDropdown = true;
						inputElement?.focus();
					}}
					type="button"
				>
					{crumb.label}
				</button>
			{/each}
		</div>
	{/if}

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
			onkeydown={handleKeydown}
			maxlength="200"
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

	{#if showDropdown && suggestions.length > 0}
		<div class="dropdown">
			{#each suggestions as item, i (item.path)}
				<button
					class="dropdown-item"
					class:selected={i === selectedIndex}
					onmousedown={() => selectTask(item.path, item.isFolder)}
					type="button"
				>
					<span class="item-left">
						{#if item.isFolder}
							<svg class="folder-icon" width="14" height="14" viewBox="0 0 16 16" fill="none">
								<path
									d="M2 4C2 3.44772 2.44772 3 3 3H6.5L8 5H13C13.5523 5 14 5.44772 14 6V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V4Z"
									stroke="currentColor"
									stroke-width="1.5"
								/>
							</svg>
						{/if}
						<span class="task-name">{item.displayName}</span>
					</span>
					<span class="item-right">
						{#if item.minutes > 0}
							<span class="task-stats">{formatMinutes(item.minutes)}</span>
						{/if}
						{#if item.isFolder}
							<svg class="chevron-icon" width="12" height="12" viewBox="0 0 16 16" fill="none">
								<path
									d="M6 4L10 8L6 12"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						{/if}
					</span>
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

	.breadcrumbs {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0 0.5rem 0.5rem;
		font-size: 0.75rem;
		font-family: var(--font-display);
	}

	.breadcrumb-item {
		background: var(--color-warm-gray-100);
		border: none;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		cursor: pointer;
		color: var(--color-warm-gray-600);
		font-size: 0.75rem;
		font-family: var(--font-display);
		transition: all 0.15s;
	}

	.breadcrumb-item:hover {
		background: var(--color-warm-gray-200);
		color: var(--color-warm-gray-800);
	}

	.breadcrumb-sep {
		color: var(--color-warm-gray-400);
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
		max-height: 280px;
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

	.dropdown-item:hover,
	.dropdown-item.selected {
		background: var(--color-warm-gray-50);
	}

	.item-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}

	.folder-icon {
		color: var(--color-coral-400);
		flex-shrink: 0;
	}

	.task-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.task-stats {
		font-size: 0.75rem;
		color: var(--color-coral-500);
		font-weight: 600;
	}

	.chevron-icon {
		color: var(--color-warm-gray-400);
	}
</style>
