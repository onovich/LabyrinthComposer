import type { RulePresetViewModel } from '@labyrinth/workbench';

type RulePresetPanelProps = {
  viewModel: RulePresetViewModel;
  onSelectPreset(rulePresetId: string): void;
  onUpdateThreshold(ruleId: string, key: string, value: number): void;
};

export function RulePresetPanel({
  viewModel,
  onSelectPreset,
  onUpdateThreshold
}: RulePresetPanelProps) {
  return (
    <section className="lc-panel-section">
      <div className="lc-section-label">Rule Preset</div>
      <label className="lc-field">
        <span>Preset</span>
        <select
          value={viewModel.currentPreset.id}
          onChange={(event) => onSelectPreset(event.target.value)}
        >
          {viewModel.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>
      <p className="lc-panel-copy">{viewModel.currentPreset.description}</p>
      <div className="lc-rule-list" aria-label="Enabled rules">
        {viewModel.enabledRuleIds.map((ruleId) => (
          <code key={ruleId}>{ruleId}</code>
        ))}
      </div>
      <div className="lc-threshold-list" aria-label="Rule thresholds">
        {viewModel.thresholds.map((threshold) => (
          <label className="lc-threshold-row" key={threshold.key}>
            <span>{threshold.key}</span>
            <input
              step="0.05"
              type="number"
              value={threshold.overrideValue ?? threshold.value}
              onChange={(event) =>
                onUpdateThreshold(threshold.ruleId, threshold.key, Number(event.target.value))
              }
            />
          </label>
        ))}
      </div>
    </section>
  );
}
