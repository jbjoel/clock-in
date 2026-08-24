<script lang="ts">
	import { settings, stats, taskStats, taskHistory } from '$lib/stores/timer';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	const currentSettings = $derived($settings);
	const currentStats = $derived($stats);
	const currentTaskStats = $derived($taskStats);
	const currentTaskHistory = $derived($taskHistory);

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
			taskStats.reset();
			taskHistory.reset();
		}
	}

	function resetSettings() {
		if (confirm('Are you sure you want to reset all settings to default?')) {
			settings.reset();
			stats.reset();
			taskStats.reset();
			taskHistory.reset();
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

	function formatMinutes(minutes: number): string {
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}

	// Get sorted task stats (by minutes, descending)
	function getSortedTaskStats(): [string, number][] {
		return Object.entries(currentTaskStats).sort((a, b) => b[1] - a[1]);
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
						<path
							d="M15 5L5 15M5 5L15 15"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
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
										<path
											d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
											stroke="currentColor"
											stroke-width="1.5"
											stroke-linecap="round"
										/>
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
				<h3>Auto Mode</h3>
				<p class="section-desc">Automatically advance through timer durations</p>
				<label class="toggle-row">
					<span>Auto-start next timer</span>
					<button
						class="toggle"
						class:active={currentSettings.autoStart}
						onclick={() => settings.toggleAutoStart()}
						role="switch"
						aria-checked={currentSettings.autoStart}
						aria-label="Toggle auto-start"
					>
						<span class="toggle-knob"></span>
					</button>
				</label>
				<p class="section-hint">
					When enabled, the next duration will automatically start after each timer completes
				</p>
			</section>

			<section class="settings-section">
				<h3>Cooldown / Rest Period</h3>
				<p class="section-desc">Take a break between focus sessions</p>
				<label class="toggle-row">
					<span>Enable cooldown</span>
					<button
						class="toggle"
						class:active={currentSettings.cooldownEnabled}
						onclick={() => settings.toggleCooldown()}
						role="switch"
						aria-checked={currentSettings.cooldownEnabled}
						aria-label="Toggle cooldown"
					>
						<span class="toggle-knob"></span>
					</button>
				</label>
				{#if currentSettings.cooldownEnabled}
					<div class="cooldown-settings">
						<label class="setting-row">
							<span>Rest duration</span>
							<div class="duration-input-wrapper">
								<input
									type="number"
									class="input-field duration-input"
									value={currentSettings.cooldownDuration}
									min="1"
									max="30"
									onchange={(e) =>
										settings.setCooldownDuration(parseInt(e.currentTarget.value) || 2)}
								/>
								<span class="duration-suffix">min</span>
							</div>
						</label>
						<label class="toggle-row">
							<span>Auto-start cooldown</span>
							<button
								class="toggle"
								class:active={currentSettings.cooldownAutoStart}
								onclick={() => settings.toggleCooldownAutoStart()}
								role="switch"
								aria-checked={currentSettings.cooldownAutoStart}
								aria-label="Toggle cooldown auto-start"
							>
								<span class="toggle-knob"></span>
							</button>
						</label>
						<p class="section-hint">
							When enabled, the rest period will automatically start after each focus session
						</p>
					</div>
				{/if}
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

				{#if getSortedTaskStats().length > 0}
					<div class="task-stats-section">
						<h4>Time by Task</h4>
						<div class="task-stats-list">
							{#each getSortedTaskStats() as [taskName, minutes] (taskName)}
								<div class="task-stat-item">
									<span class="task-stat-name">{taskName}</span>
									<span class="task-stat-time">{formatMinutes(minutes)}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}

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
		background: rgba(26, 22, 18, 0.4);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		animation: fadeIn 0.25s var(--ease-out);
	}

	.modal-content {
		background: var(--color-paper);
		border-radius: var(--radius-xl);
		padding: 1.75rem;
		max-width: 420px;
		width: 90%;
		max-height: 85vh;
		overflow-y: auto;
		box-shadow: var(--shadow-xl);
		animation: slideUp 0.35s var(--ease-bounce);
		border: 1px solid var(--color-border);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	.modal-header h2 {
		font-family: var(--font-serif);
		font-size: 1.375rem;
		font-weight: 400;
		color: var(--color-ink);
		margin: 0;
	}

	.close-btn {
		background: none;
		border: 1px solid var(--color-border);
		padding: 0.375rem;
		cursor: pointer;
		color: var(--color-ink-muted);
		border-radius: var(--radius-sm);
		transition: all 0.15s;
	}

	.close-btn:hover {
		background: var(--color-paper-warm);
		color: var(--color-ink);
		border-color: var(--color-border-strong);
	}

	.settings-section {
		padding: 1.25rem 0;
		border-top: 1px solid var(--color-border);
	}

	.settings-section:first-of-type {
		border-top: none;
		padding-top: 0;
	}

	.settings-section h3 {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-ink);
		margin: 0 0 0.25rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.section-desc {
		font-size: 0.8125rem;
		color: var(--color-ink-faint);
		margin: 0 0 1rem;
	}

	.section-hint {
		font-size: 0.75rem;
		color: var(--color-ink-faint);
		margin: 0.5rem 0 0;
		font-style: italic;
	}

	.gradations-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-bottom: 0.75rem;
	}

	.gradation-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		background: white;
		border: 1px solid var(--color-border-strong);
		padding: 0.375rem 0.625rem;
		border-radius: var(--radius-full);
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-ink-soft);
	}

	.remove-btn {
		background: none;
		border: none;
		padding: 0.125rem;
		cursor: pointer;
		color: var(--color-ink-faint);
		display: flex;
		border-radius: 50%;
		transition: all 0.15s;
	}

	.remove-btn:hover {
		color: var(--color-ember);
		background: var(--color-ember-glow);
	}

	.add-gradation {
		display: flex;
		gap: 0.5rem;
	}

	.gradation-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		font-size: 0.8125rem;
	}

	.error-text {
		font-size: 0.75rem;
		color: var(--color-ember);
		margin: 0.5rem 0 0;
	}

	.sound-options {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		margin-bottom: 1rem;
	}

	.sound-option {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.625rem 0.875rem;
		background: white;
		border: 1.5px solid var(--color-border-strong);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.15s;
		font-family: var(--font-body);
	}

	.sound-option:hover {
		border-color: var(--color-ember-light);
	}

	.sound-option.selected {
		border-color: var(--color-ember);
		background: var(--color-ember-wash);
	}

	.sound-emoji {
		font-size: 1.125rem;
	}

	.sound-name {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-ink-soft);
	}

	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0;
		cursor: pointer;
		font-size: 0.8125rem;
		color: var(--color-ink-soft);
	}

	.toggle {
		width: 40px;
		height: 24px;
		background: var(--color-paper-accent);
		border: 1.5px solid var(--color-border-strong);
		border-radius: var(--radius-full);
		cursor: pointer;
		position: relative;
		transition: all 0.2s var(--ease-out);
	}

	.toggle.active {
		background: var(--color-ink);
		border-color: var(--color-ink);
	}

	.toggle-knob {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 18px;
		height: 18px;
		background: white;
		border-radius: 50%;
		box-shadow: var(--shadow-xs);
		transition: transform 0.2s var(--ease-bounce);
	}

	.toggle.active .toggle-knob {
		transform: translateX(16px);
	}

	.stats-summary {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.stat-item {
		flex: 1;
		background: white;
		border: 1px solid var(--color-border);
		padding: 0.875rem;
		border-radius: var(--radius-md);
		text-align: center;
	}

	.stat-value {
		display: block;
		font-family: var(--font-mono);
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-ink);
	}

	.stat-label {
		font-size: 0.6875rem;
		color: var(--color-ink-faint);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.btn-ghost.danger {
		color: var(--color-ember);
	}

	.btn-ghost.danger:hover {
		background: var(--color-ember-glow);
	}

	.cooldown-settings {
		margin-top: 0.75rem;
		padding: 0.75rem;
		background: var(--color-stone-light);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
	}

	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0;
		font-size: 0.8125rem;
		color: var(--color-ink-soft);
	}

	.duration-input-wrapper {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.duration-input {
		width: 60px;
		padding: 0.375rem 0.5rem;
		font-size: 0.8125rem;
		text-align: center;
	}

	.duration-suffix {
		font-size: 0.8125rem;
		color: var(--color-ink-faint);
	}

	.task-stats-section {
		margin: 1rem 0;
	}

	.task-stats-section h4 {
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--color-ink-faint);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin: 0 0 0.5rem;
	}

	.task-stats-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-height: 140px;
		overflow-y: auto;
	}

	.task-stat-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.625rem;
		background: white;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
	}

	.task-stat-name {
		flex: 1;
		color: var(--color-ink-soft);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin-right: 0.5rem;
	}

	.task-stat-time {
		color: var(--color-ember);
		font-weight: 600;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		flex-shrink: 0;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slideUp {
		from { opacity: 0; transform: translateY(16px) scale(0.97); }
		to { opacity: 1; transform: translateY(0) scale(1); }
	}
</style>
