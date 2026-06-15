import type { ReportViewModel } from '@labyrinth/workbench';

type ReportPanelProps = {
  viewModel: ReportViewModel;
};

export function ReportPanel({ viewModel }: ReportPanelProps) {
  return (
    <section className="lc-panel-section">
      <div className="lc-section-label">Report</div>
      <div className="lc-report-summary" aria-label="Report summary">
        <div>
          <span>Preset</span>
          <strong>{viewModel.rulePresetName}</strong>
        </div>
        <div>
          <span>Errors</span>
          <strong>{viewModel.summary.errors}</strong>
        </div>
        <div>
          <span>Warnings</span>
          <strong>{viewModel.summary.warnings}</strong>
        </div>
        <div>
          <span>Suppressed</span>
          <strong>{viewModel.summary.suppressed}</strong>
        </div>
      </div>
      <div className="lc-report-preview" aria-label="Report preview">
        <strong>{viewModel.projectName}</strong>
        <span>{viewModel.schemaVersion}</span>
        <span>{viewModel.diagnostics.length} diagnostics</span>
        <span>{viewModel.exceptionCount} exceptions</span>
        <span>{viewModel.timeline.beats.length} beats</span>
      </div>
    </section>
  );
}
