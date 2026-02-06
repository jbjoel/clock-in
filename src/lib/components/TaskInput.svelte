<script lang="ts">
	import { timer } from '$lib/stores/timer';

	const taskName = $derived($timer.taskName);

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		timer.setTaskName(target.value);
	}
</script>

<div class="task-input-container">
	<input
		type="text"
		class="input-field task-input"
		placeholder="What are you focusing on?"
		value={taskName}
		oninput={handleInput}
		maxlength="100"
	/>
</div>

<style>
	.task-input-container {
		width: 100%;
		max-width: 360px;
	}

	.task-input {
		font-family: var(--font-display);
		font-size: 1rem;
		padding: 0.875rem 1.25rem;
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
</style>
