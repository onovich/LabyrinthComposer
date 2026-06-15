import type { ReportViewModel } from '@labyrinth/workbench';
import { FileJson, FileText } from 'lucide-react';

type ReportPanelProps = {
  viewModel: ReportViewModel;
  onExportReport(format: 'markdown' | 'json'): void;
};

export function ReportPanel({ viewModel, onExportReport }: ReportPanelProps) {
  return (
    <section className="lc-panel-section">
      <div className="lc-section-label">Report</div>
      <div className="lc-report-actions">
        <button
          className="lc-tool-button"
          onClick={() => onExportReport('markdown')}
          type="button"
        >
          <FileText size={14} />
          Export Markdown
        </button>
        <button className="lc-tool-button" onClick={() => onExportReport('json')} type="button">
          <FileJson size={14} />
          Export JSON
        </button>
      </div>
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
      <pre className="lc-report-markdown-preview" aria-label="Markdown report preview">
        {viewModel.markdownPreview}
      </pre>
    </section>
  );
}
