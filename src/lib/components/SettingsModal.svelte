<script lang="ts">
	import { settings, stats } from '$lib/stores/timer';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	const currentSettings = $derived($settings);
	const currentStats = $derived($stats);

	let newGradation = $state('');
	let gradationError = $state('');

	const availableSounds = [
		{ id: 'chime', name: 'Gentle Chime', emoji: '🔔' },
		{ id: 'bell', name: 'Meditation Bell', emoji: '🔊' },
		{ id: 'digital', name: 'Digital Tone', emoji: '💻' }
	];

	function addGradation() {
		const value = parseInt(newGradation);
		if (isNaN(value) || value <= 0) {
			gradationError = 'Please enter a positive number';
			return;
		}
		if (value > 180) {
			gradationError = 'Maximum 180 minutes';
			return;
		}
		if (currentSettings.gradations.includes(value)) {
			gradationError = 'Duration already exists';
			return;
		}
		settings.setGradations([...currentSettings.gradations, value]);
		newGradation = '';
		gradationError = '';
	}

	function removeGradation(duration: number) {
		if (currentSettings.gradations.length <= 1) return;
		settings.setGradations(currentSettings.gradations.filter((d) => d !== duration));
	}

	function selectSound(soundId: string) {
		settings.setSound(soundId);
	}

	function resetStats() {
		if (confirm('Are you sure you want to reset all completion statistics?')) {
			stats.reset();
		}
	}

	function resetSettings() {
		if (confirm('Are you sure you want to reset all settings to default?')) {
			settings.reset();
			stats.reset();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function getTotalCompletions(): number {
		return Object.values(currentStats).reduce((sum, count) => sum + count, 0);
	}

	function getTotalMinutes(): number {
		return Object.entries(currentStats).reduce((sum, [duration, count]) => {
			return sum + parseInt(duration) * count;
		}, 0);
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={handleBackdropClick}>
		<div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="settings-title">
			<header class="modal-header">
				<h2 id="settings-title">Settings</h2>
				<button class="close-btn" onclick={onClose} aria-label="Close settings">
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
						<path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
					</svg>
				</button>
			</header>

			<section class="settings-section">
				<h3>Time Gradations</h3>
				<p class="section-desc">Customize your focus duration options</p>
				<div class="gradations-list">
					{#each currentSettings.gradations as duration (duration)}
						<div class="gradation-item">
							<span>{duration} min</span>
							{#if currentSettings.gradations.length > 1}
								<button
									class="remove-btn"
									onclick={() => removeGradation(duration)}
									aria-label="Remove {duration} minute option"
								>
									<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
										<path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
									</svg>
								</button>
							{/if}
						</div>
					{/each}
				</div>
				<div class="add-gradation">
					<input
						type="number"
						class="input-field gradation-input"
						placeholder="Add minutes"
						bind:value={newGradation}
						min="1"
						max="180"
						onkeydown={(e) => e.key === 'Enter' && addGradation()}
					/>
					<button class="btn btn-secondary" onclick={addGradation}>Add</button>
				</div>
				{#if gradationError}
					<p class="error-text">{gradationError}</p>
				{/if}
			</section>

			<section class="settings-section">
				<h3>Notification Sound</h3>
				<p class="section-desc">Choose what plays when your timer ends</p>
				<div class="sound-options">
					{#each availableSounds as sound (sound.id)}
						<button
							class="sound-option"
							class:selected={currentSettings.selectedSound === sound.id}
							onclick={() => selectSound(sound.id)}
						>
							<span class="sound-emoji">{sound.emoji}</span>
							<span class="sound-name">{sound.name}</span>
						</button>
					{/each}
				</div>
				<label class="toggle-row">
					<span>Sound enabled</span>
				<button
					class="toggle"
					class:active={currentSettings.soundEnabled}
					onclick={() => settings.toggleSound()}
					role="switch"
					aria-checked={currentSettings.soundEnabled}
					aria-label="Toggle sound"
				>
					<span class="toggle-knob"></span>
				</button>
				</label>
			</section>

			<section class="settings-section">
				<h3>Statistics</h3>
				<div class="stats-summary">
					<div class="stat-item">
						<span class="stat-value">{getTotalCompletions()}</span>
						<span class="stat-label">sessions</span>
					</div>
					<div class="stat-item">
						<span class="stat-value">{getTotalMinutes()}</span>
						<span class="stat-label">minutes focused</span>
					</div>
				</div>
				<button class="btn btn-ghost danger" onclick={resetStats}>Reset Statistics</button>
			</section>

			<section class="settings-section">
				<button class="btn btn-ghost danger" onclick={resetSettings}>Reset All Settings</button>
			</section>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(26, 23, 21, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		animation: fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.modal-content {
		background: white;
		border-radius: 24px;
		padding: 1.5rem;
		max-width: 420px;
		width: 90%;
		max-height: 85vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
		animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	.modal-header h2 {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-warm-gray-800);
		margin: 0;
	}

	.close-btn {
		background: none;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		color: var(--color-warm-gray-500);
		border-radius: 8px;
		transition: all 0.15s;
	}

	.close-btn:hover {
		background: var(--color-warm-gray-100);
		color: var(--color-warm-gray-700);
	}

	.settings-section {
		padding: 1.25rem 0;
		border-top: 1px solid var(--color-warm-gray-200);
	}

	.settings-section:first-of-type {
		border-top: none;
		padding-top: 0;
	}

	.settings-section h3 {
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--color-warm-gray-800);
		margin: 0 0 0.25rem;
	}

	.section-desc {
		font-size: 0.8125rem;
		color: var(--color-warm-gray-500);
		margin: 0 0 1rem;
	}

	.gradations-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.gradation-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--color-warm-gray-100);
		padding: 0.5rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.remove-btn {
		background: none;
		border: none;
		padding: 0.125rem;
		cursor: pointer;
		color: var(--color-warm-gray-400);
		display: flex;
		border-radius: 50%;
		transition: all 0.15s;
	}

	.remove-btn:hover {
		color: var(--color-coral-600);
		background: rgba(224, 123, 103, 0.1);
	}

	.add-gradation {
		display: flex;
		gap: 0.5rem;
	}

	.gradation-input {
		flex: 1;
		padding: 0.625rem 1rem;
		font-size: 0.875rem;
	}

	.error-text {
		font-size: 0.75rem;
		color: var(--color-coral-600);
		margin: 0.5rem 0 0;
	}

	.sound-options {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.sound-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: var(--color-warm-gray-50);
		border: 2px solid var(--color-warm-gray-200);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.15s;
		font-family: var(--font-display);
	}

	.sound-option:hover {
		border-color: var(--color-coral-300);
	}

	.sound-option.selected {
		border-color: var(--color-coral-500);
		background: rgba(224, 123, 103, 0.08);
	}

	.sound-emoji {
		font-size: 1.25rem;
	}

	.sound-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-warm-gray-700);
	}

	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--color-warm-gray-700);
	}

	.toggle {
		width: 48px;
		height: 28px;
		background: var(--color-warm-gray-300);
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		position: relative;
		transition: background 0.2s;
	}

	.toggle.active {
		background: var(--color-coral-500);
	}

	.toggle-knob {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 22px;
		height: 22px;
		background: white;
		border-radius: 50%;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.toggle.active .toggle-knob {
		transform: translateX(20px);
	}

	.stats-summary {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.stat-item {
		flex: 1;
		background: var(--color-warm-gray-50);
		padding: 1rem;
		border-radius: 12px;
		text-align: center;
	}

	.stat-value {
		display: block;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-coral-500);
	}

	.stat-label {
		font-size: 0.75rem;
		color: var(--color-warm-gray-500);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.btn-ghost.danger {
		color: var(--color-coral-600);
	}

	.btn-ghost.danger:hover {
		background: rgba(224, 123, 103, 0.1);
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slideUp {
		from { 
			opacity: 0;
			transform: translateY(20px) scale(0.98);
		}
		to { 
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>
