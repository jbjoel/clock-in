<script lang="ts">
	import { timer, taskHistory, taskStats } from '$lib/stores/timer';
	import { getAutocompleteSuggestions, formatMinutes } from '$lib/utils/taskTree';

	const taskName = $derived($timer.taskName);
	const history = $derived($taskHistory);
	const stats = $derived($taskStats);

	let showDropdown = $state(false);
	let inputElement: HTMLInputElement | undefined = $state();
	let selectedIndex = $state(-1);

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

	const breadcrumbs = $derived.by(() => {
		const trimmed = taskName.trim();
		if (!trimmed.includes('/')) return [];
		const parts = trimmed.split('/');
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
				class="crumb crumb-root"
				aria-label="All tasks"
				onmousedown={() => {
					timer.setTaskName('');
					showDropdown = true;
					inputElement?.focus();
				}}
				type="button"
			>
				<svg width="12" height="12" viewBox="0 0 16 16" fill="none">
					<path d="M2 6L8 2L14 6V14H2V6Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
				</svg>
			</button>
			{#each breadcrumbs as crumb (crumb.path)}
				<span class="crumb-sep">/</span>
				<button
					class="crumb"
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
			class="task-input"
			placeholder="What are you working on?"
			value={taskName}
			oninput={handleInput}
			onfocus={handleFocus}
			onblur={handleBlur}
			onkeydown={handleKeydown}
			maxlength="200"
			autocomplete="off"
			spellcheck="false"
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
				<svg width="14" height="14" viewBox="0 0 16 16" fill="none">
					<path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
							<span class="folder-dot"></span>
						{/if}
						<span class="item-name">{item.displayName}</span>
					</span>
					<span class="item-right">
						{#if item.minutes > 0}
							<span class="item-time">{formatMinutes(item.minutes)}</span>
						{/if}
						{#if item.isFolder}
							<svg class="item-chevron" width="10" height="10" viewBox="0 0 16 16" fill="none">
								<path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
		max-width: 340px;
		position: relative;
	}

	.breadcrumbs {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0 0.25rem 0.5rem;
		font-size: 0.6875rem;
		font-family: var(--font-body);
	}

	.crumb {
		background: var(--color-paper-warm);
		border: 1px solid var(--color-border);
		padding: 0.2rem 0.5rem;
		border-radius: var(--radius-sm);
		cursor: pointer;
		color: var(--color-ink-muted);
		font-size: 0.6875rem;
		font-family: var(--font-body);
		font-weight: 500;
		transition: all 0.15s var(--ease-out);
		display: flex;
		align-items: center;
	}

	.crumb:hover {
		background: var(--color-paper-deep);
		color: var(--color-ink-soft);
		border-color: var(--color-border-strong);
	}

	.crumb-root {
		padding: 0.25rem 0.375rem;
	}

	.crumb-sep {
		color: var(--color-ink-faint);
		opacity: 0.5;
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.task-input {
		font-family: var(--font-body);
		font-size: 0.9375rem;
		font-weight: 500;
		padding: 0.75rem 2.25rem 0.75rem 1rem;
		border: 1.5px solid var(--color-border-strong);
		border-radius: var(--radius-lg);
		background: white;
		color: var(--color-ink);
		transition: all 0.2s var(--ease-out);
		width: 100%;
		text-align: center;
		box-shadow: var(--shadow-inset);
	}

	.task-input::placeholder {
		color: var(--color-ink-faint);
		font-weight: 400;
	}

	.task-input:focus {
		outline: none;
		border-color: var(--color-ember);
		box-shadow: 0 0 0 3px var(--color-ember-glow);
	}

	.dropdown-trigger {
		position: absolute;
		right: 0.625rem;
		background: none;
		border: none;
		padding: 0.375rem;
		cursor: pointer;
		color: var(--color-ink-faint);
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		transition: all 0.15s;
	}

	.dropdown-trigger:hover {
		color: var(--color-ink-muted);
		background: var(--color-paper-warm);
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		right: 0;
		background: white;
		border: 1.5px solid var(--color-border-strong);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		z-index: 50;
		max-height: 240px;
		overflow-y: auto;
		animation: slideDown 0.15s var(--ease-out);
	}

	@keyframes slideDown {
		from { opacity: 0; transform: translateY(-4px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.dropdown-item {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.625rem 0.875rem;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		font-family: var(--font-body);
		font-size: 0.8125rem;
		color: var(--color-ink-soft);
		transition: background 0.1s;
	}

	.dropdown-item:first-child { border-radius: 14px 14px 0 0; }
	.dropdown-item:last-child { border-radius: 0 0 14px 14px; }
	.dropdown-item:only-child { border-radius: 14px; }

	.dropdown-item:hover,
	.dropdown-item.selected {
		background: var(--color-paper-warm);
	}

	.item-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}

	.folder-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-ember);
		flex-shrink: 0;
	}

	.item-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-right {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
	}

	.item-time {
		font-size: 0.6875rem;
		color: var(--color-ember);
		font-weight: 600;
		font-family: var(--font-mono);
		letter-spacing: -0.02em;
	}

	.item-chevron {
		color: var(--color-ink-faint);
	}
</style>
