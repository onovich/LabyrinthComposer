import type { ExportViewModel } from '@labyrinth/workbench';
import { FileCode2 } from 'lucide-react';

type ExportPanelProps = {
  viewModel: ExportViewModel;
  onExportEngineJson(): void;
};

export function ExportPanel({ viewModel, onExportEngineJson }: ExportPanelProps) {
  return (
    <section className="lc-panel-section">
      <div className="lc-section-label">Export</div>
      <div className="lc-export-actions">
        <button className="lc-tool-button" onClick={onExportEngineJson} type="button">
          <FileCode2 size={14} />
          Engine JSON
        </button>
      </div>
      <div className="lc-export-summary" aria-label="Engine export summary">
        <div>
          <span>Spaces</span>
          <strong>{viewModel.spaces}</strong>
        </div>
        <div>
          <span>Gates</span>
          <strong>{viewModel.gates}</strong>
        </div>
        <div>
          <span>Tokens</span>
          <strong>{viewModel.tokens}</strong>
        </div>
        <div>
          <span>Diagnostics</span>
          <strong>{viewModel.diagnostics}</strong>
        </div>
      </div>
      <div className={`lc-export-state ${viewModel.validationOk ? '' : 'lc-export-state-warning'}`}>
        {viewModel.projectName}
      </div>
    </section>
  );
}
