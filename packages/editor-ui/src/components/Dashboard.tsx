export type TemplateCardViewModel = {
  id: string;
  name: string;
  category: string;
  description: string;
  stats: string;
};

type DashboardProps = {
  templates: TemplateCardViewModel[];
  operationMessage: string;
  onSelectTemplate(id: string): void;
  onOpenProject(): void;
};

export function Dashboard({
  templates,
  operationMessage,
  onSelectTemplate,
  onOpenProject
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
