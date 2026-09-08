import './styles.css';

type Workspace = 'inferencex' | 'plot-tool';
type PlotToolModule = typeof import('./plotTool');

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app root');

app.innerHTML = `
  <header class="workspace-header no-export">
    <div class="workspace-attribution">
      Modified fork by
      <a href="https://github.com/charxwu/InferenceXCurve" target="_blank" rel="noreferrer">charxwu</a>
      · Original by
      <a
        class="original-author-link"
        href="https://github.com/Duyi-Wang/InferenceXCurve"
        target="_blank"
        rel="noreferrer"
      >Duyi-Wang</a>
    </div>
    <nav class="workspace-tabs" aria-label="Workspace">
      <a class="workspace-tab" href="#/inferencex" data-workspace="inferencex">InferenceX Curve</a>
      <a class="workspace-tab" href="#/plot-tool" data-workspace="plot-tool">Plot Tool</a>
    </nav>
  </header>
  <div id="inferencex-workspace-root" class="workspace-panel" hidden></div>
  <div id="plot-tool-workspace-root" class="workspace-panel" hidden></div>
`;

const inferenceRoot = document.querySelector<HTMLDivElement>('#inferencex-workspace-root')!;
const plotRoot = document.querySelector<HTMLDivElement>('#plot-tool-workspace-root')!;
const tabs = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-workspace]'));

let activeWorkspace: Workspace | null = null;
let inferenceLoaded = false;
let plotToolModule: PlotToolModule | null = null;
let unmountPlotTool: (() => void) | null = null;
let navigationVersion = 0;

function readWorkspace(): Workspace | null {
  if (window.location.hash === '#/inferencex') return 'inferencex';
  if (window.location.hash === '#/plot-tool') return 'plot-tool';
  return null;
}

function normalizeWorkspaceHash(): Workspace {
  const workspace = readWorkspace();
  if (workspace) return workspace;
  const url = `${window.location.pathname}${window.location.search}#/inferencex`;
  window.history.replaceState(null, '', url);
  return 'inferencex';
}

async function activateWorkspace(workspace: Workspace): Promise<void> {
  const version = ++navigationVersion;
  if (activeWorkspace === workspace) return;

  if (activeWorkspace === 'inferencex') {
    window.dispatchEvent(new Event('inferencex-workspace-deactivate'));
  }
  if (activeWorkspace === 'plot-tool') {
    unmountPlotTool?.();
    unmountPlotTool = null;
  }

  activeWorkspace = workspace;
  inferenceRoot.hidden = workspace !== 'inferencex';
  plotRoot.hidden = workspace !== 'plot-tool';
  tabs.forEach((tab) => {
    const selected = tab.dataset.workspace === workspace;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-current', selected ? 'page' : 'false');
  });
  document.title = workspace === 'inferencex' ? 'InferenceX Curve' : 'Pareto Plot Tool';

  if (workspace === 'inferencex') {
    if (!inferenceLoaded) {
      await import('./main');
      inferenceLoaded = true;
    }
    if (version !== navigationVersion || activeWorkspace !== workspace) return;
    window.dispatchEvent(new Event('inferencex-workspace-activate'));
    return;
  }

  plotToolModule ??= await import('./plotTool');
  if (version !== navigationVersion || activeWorkspace !== workspace) return;
  unmountPlotTool = plotToolModule.mountPlotTool(plotRoot);
}

function handleNavigation(): void {
  void activateWorkspace(normalizeWorkspaceHash());
}

window.addEventListener('hashchange', handleNavigation);
handleNavigation();
