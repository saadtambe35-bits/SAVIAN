import React, { useState } from 'react';
import { Sidebar, NavItemKey } from '@/components/layout/Sidebar';
import { Header, SolverStatusType } from '@/components/layout/Header';
import { StatusBar } from '@/components/layout/StatusBar';
import { DashboardView } from '@/components/views/DashboardView';
import { MareyView } from '@/components/views/MareyView';
import { DemandsView } from '@/components/views/DemandsView';
import { SolverView } from '@/components/views/SolverView';
import { LifecycleView } from '@/components/views/LifecycleView';
import { SettingsView } from '@/components/views/SettingsView';
import { BlockDemand, SolverResult, TelemetryEvent } from '@/types';
import {
  PRESET_SCENARIOS,
  MOCK_TELEMETRY,
} from '@/data/mockData';
import { LanguageProvider } from '@/i18n/LanguageContext';
import { StationDigitalTwin3D } from '@/components/digitaltwin/StationDigitalTwin3D';
import { DepartmentTrustMatrix } from '@/components/discipline/DepartmentTrustMatrix';

export const App: React.FC = () => {
  // Navigation State
  const [activeNav, setActiveNav] = useState<NavItemKey>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Scenario State
  const [currentScenario, setCurrentScenario] = useState<string>('standard');
  const [demands, setDemands] = useState<BlockDemand[]>(
    PRESET_SCENARIOS['standard'].demands
  );
  const [solverResult, setSolverResult] = useState<SolverResult>(
    PRESET_SCENARIOS['standard'].defaultSolverResult
  );
  const [telemetryData, setTelemetryData] = useState<TelemetryEvent[]>(MOCK_TELEMETRY);

  // System Controls State
  const [chaosMode, setChaosMode] = useState<boolean>(false);
  const [solverStatus, setSolverStatus] = useState<SolverStatusType>('idle');
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>('SOLV-2026-BPL-0941');
  const [lastSolveTime, setLastSolveTime] = useState<string>('19:42:08 IST');
  const [solveDurationSec, setSolveDurationSec] = useState<number>(1.84);

  // Live Multi-stage Solver Animation State
  const [solvingPhase, setSolvingPhase] = useState<string>(
    'Phase 1: Ingesting Demands & Pruning Overlaps...'
  );
  const [solvingProgress, setSolvingProgress] = useState<number>(0);

  // Scenario Switcher Handler
  const handleSelectScenario = (scenarioId: string) => {
    const scen = PRESET_SCENARIOS[scenarioId];
    if (!scen) return;
    setCurrentScenario(scenarioId);
    setDemands([...scen.demands]);
    setSolverResult({ ...scen.defaultSolverResult });
    setActiveSessionId(scen.defaultSolverResult.solve_id);
    setSolverStatus('idle');
  };

  // Demand CRUD Handlers
  const handleAddDemand = (demand: BlockDemand) => {
    setDemands((prev) => [demand, ...prev]);
  };

  const handleUpdateDemand = (updated: BlockDemand) => {
    setDemands((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleDeleteDemand = (id: number) => {
    setDemands((prev) => prev.filter((d) => d.id !== id));
  };

  // Realistic Multi-Stage AI Solver Simulation
  const handleRunSolver = () => {
    if (solverStatus === 'solving') return;

    setSolverStatus('solving');
    setSolvingProgress(15);
    setSolvingPhase('Phase 1: Ingesting Corridor Demands & Feasibility Bounds...');

    // Stage 2: Boolean Formulations
    setTimeout(() => {
      setSolvingProgress(45);
      setSolvingPhase('Phase 2: CP-SAT Boolean Headway & Kavach SIL-4 Bounds...');
    }, 600);

    // Stage 3: Pareto Frontier & Shadow Merging
    setTimeout(() => {
      setSolvingProgress(75);
      setSolvingPhase('Phase 3: Multi-Objective Pareto Frontier & Shadow Harvesting...');
    }, 1300);

    // Stage 4: Convergence
    setTimeout(() => {
      setSolvingProgress(95);
      setSolvingPhase('Phase 4: Proving Global Optimum with Zero Train Penalties...');
    }, 1900);

    // Done
    setTimeout(() => {
      setSolvingProgress(100);
      setSolverStatus('done');
      setSolveDurationSec(2.14);
      const now = new Date();
      setLastSolveTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} IST`
      );
      const newSession = `SOLV-2026-BPL-${Math.floor(1000 + Math.random() * 9000)}`;
      setActiveSessionId(newSession);

      // Re-harmonize solver result with dynamic shadow counts
      setSolverResult((prev) => ({
        ...prev,
        solve_id: newSession,
        status: 'OPTIMAL',
        optimality_gap: 0.0,
        wall_time_sec: 2.14,
        clashes_detected: 0,
        shadow_merges: Math.max(2, Math.floor(demands.length / 2)),
      }));
    }, 2400);
  };

  // Nav Title Helper
  const getNavTitle = (): { title: string; subtitle?: string } => {
    switch (activeNav) {
      case 'dashboard':
        return {
          title: 'Corridor Overview',
          subtitle: 'Live Operations & Block Schedule Dashboard',
        };
      case 'marey':
        return {
          title: 'Marey Time-Space Diagram',
          subtitle: 'Interactive Stringline Timetable & Block Bands (D3.js)',
        };
      case 'demands':
        return {
          title: 'Block Demands',
          subtitle: 'TMS, SMMS & TDMS Maintenance Requests',
        };
      case 'solver':
        return {
          title: 'AI Scheduling Cockpit',
          subtitle: 'CP-SAT Optimization & Explainable Reasoning (XAI)',
        };
      case 'lifecycle':
        return {
          title: 'Block Lifecycle',
          subtitle: 'Proposal to Station Master Line-Clear Execution Pipeline',
        };
      case 'digitaltwin':
        return {
          title: '3D Station Yard Digital Twin',
          subtitle: 'Interactive 2.5D Isometric Rail Yard & Lockout Visualizer',
        };
      case 'discipline':
        return {
          title: 'Departmental Discipline Matrix',
          subtitle: 'P-Way, S&T & OHE Historical Trust Scores & Solver Penalties',
        };
      case 'settings':
        return {
          title: 'System Settings',
          subtitle: 'Corridor Rules & Kavach Constraints',
        };
      default:
        return { title: 'Line-Clear' };
    }
  };

  const navMeta = getNavTitle();

  return (
    <LanguageProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-transparent text-stone-800 font-sans">
        {/* 1. Left Sidebar (Fixed / Desktop w-64, Drawer on Mobile) */}
        <Sidebar
          activeNav={activeNav}
          onSelectNav={(key) => setActiveNav(key)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        demandCount={demands.length}
        activeClashes={solverResult.clashes_detected}
      />

      {/* 2. Main Wrapper (Offset on desktop for w-64 sidebar) */}
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-64">
        {/* Top Header */}
        <Header
          title={navMeta.title}
          subtitle={navMeta.subtitle}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          chaosMode={chaosMode}
          onChaosModeChange={(chaos) => setChaosMode(chaos)}
          solverStatus={solverStatus}
          onRunSolver={handleRunSolver}
          unreadAlertCount={3}
          currentScenario={currentScenario}
          onSelectScenario={handleSelectScenario}
        />

        {/* Center Main Content Area (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-transparent">
          <div className="mx-auto max-w-7xl">
            {activeNav === 'dashboard' && (
              <DashboardView
                chaosMode={chaosMode}
                onRunSolver={handleRunSolver}
                solverStatus={solverStatus}
                onNavigate={(view) => setActiveNav(view as any)}
                demands={demands}
                solverResult={solverResult}
              />
            )}

            {activeNav === 'marey' && (
              <MareyView
                chaosMode={chaosMode}
                onChaosModeChange={(chaos) => setChaosMode(chaos)}
              />
            )}

            {activeNav === 'demands' && (
              <DemandsView
                demands={demands}
                onAddDemand={handleAddDemand}
                onUpdateDemand={handleUpdateDemand}
                onDeleteDemand={handleDeleteDemand}
              />
            )}

            {activeNav === 'solver' && (
              <SolverView
                solverStatus={solverStatus}
                onRunSolver={handleRunSolver}
                solverResult={solverResult}
                telemetryData={telemetryData}
                solvingPhase={solvingPhase}
                solvingProgress={solvingProgress}
              />
            )}

            {activeNav === 'lifecycle' && (
              <LifecycleView
                demands={demands}
                onUpdateDemand={handleUpdateDemand}
              />
            )}

            {activeNav === 'digitaltwin' && (
              <div className="rounded-2xl skin-glass-card p-4">
                <StationDigitalTwin3D />
              </div>
            )}

            {activeNav === 'discipline' && (
              <div className="rounded-2xl skin-glass-card p-4">
                <DepartmentTrustMatrix />
              </div>
            )}

            {activeNav === 'settings' && <SettingsView />}
          </div>
        </main>

        {/* Bottom Status Bar */}
        <StatusBar
          isConnected={isConnected}
          onToggleConnection={() => setIsConnected(!isConnected)}
          activeSessionId={activeSessionId}
          lastSolveTime={lastSolveTime}
          solveDurationSec={solveDurationSec}
          optimalityGap={solverResult.optimality_gap}
        />
      </div>
    </div>
    </LanguageProvider>
  );
};

export default App;

