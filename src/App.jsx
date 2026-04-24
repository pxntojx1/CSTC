import { useState } from 'react';
import useGameStore from './store/gameStore';
import MainMenu from './components/MainMenu';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import CompanyPanel from './components/CompanyPanel';
import RosterTable from './components/RosterTable';
import ShowBuilder from './components/ShowBuilder';
import StipulationsPanel from './components/StipulationsPanel';
import SponsorsPanel from './components/SponsorsPanel';
import TVDealsPanel from './components/TVDealsPanel';
import FinancesPanel from './components/FinancesPanel';
import ChampionshipsPanel from './components/ChampionshipsPanel';
import DevelopmentPanel from './components/DevelopmentPanel';
import FreeAgentsPanel from './components/FreeAgentsPanel';
import SettingsPanel from './components/SettingsPanel';
import BankruptcyModal from './components/BankruptcyModal';
import { formatCurrency, formatFollowers } from './engine/utils';
import { format, parseISO } from 'date-fns';

const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',      icon: '🏠' },
  { id: 'calendar',      label: 'Calendar',        icon: '📅' },
  { id: 'roster',        label: 'Roster',          icon: '🤼' },
  { id: 'freeagents',   label: 'Free Agents',     icon: '🤝' },
  { id: 'shows',         label: 'Shows',           icon: '🎭' },
  { id: 'championships', label: 'Championships',   icon: '🏆' },
  { id: 'finances',      label: 'Finances',        icon: '📊' },
  { id: 'development',   label: 'Development',     icon: '🎓' },
  null, // divider
  { id: 'settings',     label: 'Settings',        icon: '⚙️' },
];

function Sidebar({ active, onNavigate, company, currentDate, weekNumber, collapsed, onToggle, onMainMenu }) {
  return (
    <aside style={{
      width: collapsed ? 56 : 224,
      minHeight: '100vh',
      background: 'var(--sidebar)',
      borderRight: '1px solid #1f2937',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      overflow: 'hidden',
      flexShrink: 0,
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '12px 0' : '12px 14px',
        borderBottom: '1px solid #1f2937',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 8,
        minHeight: 64,
      }}>
        {!collapsed && (
          <button
            onClick={onMainMenu}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 10 }}
            title="Main Menu"
          >
            <img src="/logo.png" alt="CSTC" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} />
            <div style={{
              fontFamily: 'Anton, sans-serif', fontSize: 10, color: '#10b981',
              letterSpacing: 1.5, lineHeight: 1.4, textTransform: 'uppercase',
            }}>
              Card Subject<br />To Change
            </div>
          </button>
        )}
        {collapsed && (
          <button onClick={onMainMenu} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} title="Main Menu">
            <img src="/logo.png" alt="CSTC" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6 }} />
          </button>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1 }}
            title="Collapse sidebar"
          >
            ‹
          </button>
        )}
      </div>

      {/* Company info */}
      {!collapsed && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1f2937' }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: '#e5e7eb',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {company.name}
          </div>
          <div style={{ fontSize: 12, color: company.funds < 0 ? '#ef4444' : '#10b981', marginTop: 2 }}>
            {formatCurrency(company.funds)}
          </div>
          <div style={{ fontSize: 11, color: '#4b5563', marginTop: 1 }}>
            {formatFollowers(company.followers)} followers · Wk {weekNumber}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map((item, idx) => {
          if (!item) {
            // divider
            return <div key={`div-${idx}`} style={{ height: 1, background: '#1f2937', margin: '8px 12px' }} />;
          }
          const { id, label, icon } = item;
          const isActive = active === id;
          return (
            <button
              key={id}
              className={`nav-item${isActive ? ' active' : ''}`}
              onClick={() => onNavigate(id)}
              title={collapsed ? label : undefined}
              style={{
                justifyContent: collapsed ? 'center' : 'flex-start',
                width: collapsed ? '100%' : 'calc(100% - 16px)',
                padding: collapsed ? '10px 0' : '9px 16px',
                margin: collapsed ? '1px 0' : '1px 8px',
              }}
            >
              <span className="nav-icon">{icon}</span>
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle at bottom when collapsed */}
      {collapsed && (
        <button
          onClick={onToggle}
          style={{
            background: 'none', border: 'none', color: '#374151', cursor: 'pointer',
            fontSize: 18, padding: '12px 0', width: '100%', textAlign: 'center',
          }}
          title="Expand sidebar"
        >
          ›
        </button>
      )}

      {/* Date / warning */}
      {!collapsed && (
        <div style={{ padding: '10px 16px', borderTop: '1px solid #1f2937' }}>
          <div style={{ color: '#374151', fontSize: 11 }}>
            {format(parseISO(currentDate), 'MMM d, yyyy')}
          </div>
          {company.isBankrupt && (
            <div style={{ color: '#ef4444', fontSize: 11, marginTop: 3, fontWeight: 600 }}>
              ⚠ BANKRUPT
            </div>
          )}
          {!company.isBankrupt && company.negativeFundsStreak >= 3 && (
            <div style={{ color: '#f59e0b', fontSize: 11, marginTop: 3 }}>
              ⚠ {company.negativeFundsStreak} neg. months
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

function TopBar({ company, weekNumber, currentDate }) {
  const { advanceDay } = useGameStore();
  const isBankrupt = company.isBankrupt;

  return (
    <div style={{
      height: 56,
      background: 'var(--card)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 16,
      flexShrink: 0,
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Alerts */}
      {isBankrupt && (
        <div style={{
          flex: 1, background: 'var(--danger-lt)', border: '1px solid #fca5a5',
          borderRadius: 6, padding: '6px 14px', color: '#991b1b',
          fontSize: 13, fontWeight: 600,
        }}>
          ⚠ COMPANY BANKRUPT — {company.bankruptcyWeeksRemaining} weeks to recover
        </div>
      )}
      {!isBankrupt && company.negativeFundsStreak >= 5 && (
        <div style={{
          flex: 1, background: '#fff7ed', border: '1px solid #fed7aa',
          borderRadius: 6, padding: '6px 14px', color: '#9a3412', fontSize: 13, fontWeight: 600,
        }}>
          🚨 BANKRUPTCY IMMINENT — 1 month remaining!
        </div>
      )}
      {!isBankrupt && company.negativeFundsStreak >= 3 && company.negativeFundsStreak < 5 && (
        <div style={{
          flex: 1, background: 'var(--warning-lt)', border: '1px solid #fcd34d',
          borderRadius: 6, padding: '6px 14px', color: '#92400e', fontSize: 13,
        }}>
          ⚠ Financial Warning: {company.negativeFundsStreak} consecutive negative months
        </div>
      )}
      {company.negativeFundsStreak < 3 && <div style={{ flex: 1 }} />}

      {/* Right side */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#9ca3af', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Followers</div>
          <div style={{ color: '#111827', fontSize: 14, fontFamily: 'Anton, sans-serif' }}>
            {formatFollowers(company.followers)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#9ca3af', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Balance</div>
          <div style={{
            fontSize: 14, fontFamily: 'Anton, sans-serif',
            color: company.funds < 0 ? 'var(--danger)' : '#111827',
          }}>
            {formatCurrency(company.funds)}
          </div>
        </div>
        <div style={{ width: 1, height: 32, background: 'var(--border)' }} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#9ca3af', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Date</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>
            {format(parseISO(currentDate), 'EEE, MMM d yyyy')}
          </div>
        </div>
        <button onClick={advanceDay} className="btn btn-primary">
          Advance Day ›
        </button>
      </div>
    </div>
  );
}

function PageContent({ active, onNavigate }) {
  switch (active) {
    case 'dashboard':     return <Dashboard onNavigate={onNavigate} />;
    case 'calendar':      return <CalendarView onNavigate={onNavigate} />;
    case 'company':       return <CompanyPanel />;
    case 'roster':        return <RosterTable />;
    case 'freeagents':   return <FreeAgentsPanel />;
    case 'shows':         return <ShowBuilder />;
    case 'stipulations':  return <StipulationsPanel />;
    case 'sponsors':      return <SponsorsPanel />;
    case 'tvdeals':       return <TVDealsPanel />;
    case 'finances':      return <FinancesPanel />;
    case 'championships': return <ChampionshipsPanel />;
    case 'development':   return <DevelopmentPanel />;
    case 'settings':     return <SettingsPanel />;
    default:              return <Dashboard onNavigate={onNavigate} />;
  }
}

export default function App() {
  const { initialized, company, currentDate, weekNumber, dayNumber, gameName, exitGame } = useGameStore();
  const [activePage, setActivePage]         = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMainMenu, setShowMainMenu]     = useState(false);

  // Show main menu if not initialized OR user chose to go back
  if (!initialized || showMainMenu) {
    return <MainMenu onEnterGame={() => setShowMainMenu(false)} />;
  }

  const handleMainMenu = () => setShowMainMenu(true);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar
        active={activePage}
        onNavigate={setActivePage}
        company={company}
        currentDate={currentDate}
        weekNumber={weekNumber}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
        onMainMenu={handleMainMenu}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <TopBar
          company={company}
          weekNumber={weekNumber}
          currentDate={currentDate}
        />

        <main style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--bg)',
        }}>
          <PageContent active={activePage} onNavigate={setActivePage} />
        </main>
      </div>

      <BankruptcyModal />
    </div>
  );
}
