import type { RulePresetViewModel } from '@labyrinth/workbench';

export type TemplateCardViewModel = {
  id: string;
  name: string;
  category: string;
  description: string;
  stats: string;
};

export type RecentProjectViewModel = {
  path: string;
  label: string;
  lastOpenedAt: string;
};

type DashboardProps = {
  templates: TemplateCardViewModel[];
  recentProjects: RecentProjectViewModel[];
  operationMessage: string;
  rulePreset: RulePresetViewModel;
  onSelectTemplate(id: string): void;
  onOpenProject(): void;
  onSelectRulePreset(rulePresetId: string): void;
};

export function Dashboard({
  templates,
  recentProjects,
  operationMessage,
  rulePreset,
  onSelectTemplate,
  onOpenProject,
  onSelectRulePreset
}: DashboardProps) {
  return (
    <main className="lc-dashboard" aria-label="Project dashboard">
      <section className="lc-dashboard-header">
        <div>
          <div className="lc-brand">Labyrinth Composer</div>
          <h1>Choose a starting structure</h1>
          <p>
            Start from a design pattern, then validate how players explore, get blocked, find
            solutions, backtrack, and unlock new meaning in the space.
          </p>
        </div>
        <button
          className="lc-tool-button lc-tool-button-primary"
          onClick={onOpenProject}
          type="button"
        >
          Open project
        </button>
      </section>
      <section className="lc-dashboard-preset" aria-label="Initial rule preset">
        <label className="lc-field">
          <span>Rule preset</span>
          <select
            value={rulePreset.currentPreset.id}
            onChange={(event) => onSelectRulePreset(event.target.value)}
          >
            {rulePreset.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <p>{rulePreset.currentPreset.description}</p>
      </section>
      {recentProjects.length > 0 ? (
        <section className="lc-dashboard-recent" aria-label="Recent files">
          <div className="lc-section-label">Recent Files</div>
          <ul>
            {recentProjects.map((project) => (
              <li key={project.path}>
                <strong>{project.label}</strong>
                <span>{project.path}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="lc-template-grid" aria-label="Templates">
        {templates.map((template) => (
          <button
            className="lc-template-card"
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            type="button"
          >
            <span>{template.category}</span>
            <strong>{template.name}</strong>
            <p>{template.description}</p>
            <small>{template.stats}</small>
          </button>
        ))}
      </section>
      <div className="lc-dashboard-status">{operationMessage}</div>
    </main>
  );
}
