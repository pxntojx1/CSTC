import { useState } from 'react';
import useGameStore from '../store/gameStore';
import NewGameWizard from './NewGameWizard';

export default function MainMenu({ onEnterGame }) {
  const { initialized, gameName, company, exitGame } = useGameStore();
  const [showWizard, setShowWizard] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  if (showWizard) return <NewGameWizard onCancel={() => setShowWizard(false)} />;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-10%',
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(16,185,129,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 64, position: 'relative' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 80, height: 80, borderRadius: 20,
          background: 'linear-gradient(135deg, #10b981, #059669)',
          marginBottom: 24,
          boxShadow: '0 0 40px rgba(16,185,129,0.4)',
        }}>
          <span style={{ fontSize: 38 }}>🎭</span>
        </div>
        <div style={{
          fontFamily: 'Anton, sans-serif',
          fontSize: 42,
          color: '#f8fafc',
          letterSpacing: 2,
          lineHeight: 1.1,
          marginBottom: 8,
        }}>
          CARD SUBJECT
        </div>
        <div style={{
          fontFamily: 'Anton, sans-serif',
          fontSize: 42,
          letterSpacing: 2,
          lineHeight: 1.1,
          background: 'linear-gradient(135deg, #10b981, #34d399)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          TO CHANGE
        </div>
        <div style={{
          color: '#64748b', fontSize: 13, letterSpacing: 3,
          textTransform: 'uppercase', marginTop: 12,
        }}>
          Pro Wrestling Promotion Manager
        </div>
      </div>

      {/* Main actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320, position: 'relative' }}>
        {/* Continue game (if one exists) */}
        {initialized && (
          <div style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 8,
          }}>
            <div style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              Current Save
            </div>
            <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 15 }}>
              {gameName || company?.name || 'My Game'}
            </div>
            {company && (
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                {company.name} · ${(company.funds / 1000).toFixed(0)}K
              </div>
            )}
          </div>
        )}

        {initialized && (
          <button
            onClick={() => onEnterGame?.()}
            style={{
              padding: '16px 24px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none', borderRadius: 10,
              color: '#fff', fontSize: 16,
              fontFamily: 'Anton, sans-serif', letterSpacing: 1,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            CONTINUE GAME
          </button>
        )}

        <button
          onClick={() => setShowWizard(true)}
          style={{
            padding: '16px 24px',
            background: initialized ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #10b981, #059669)',
            border: initialized ? '1px solid rgba(255,255,255,0.1)' : 'none',
            borderRadius: 10,
            color: initialized ? '#94a3b8' : '#fff',
            fontSize: initialized ? 14 : 16,
            fontFamily: 'Anton, sans-serif', letterSpacing: 1,
            cursor: 'pointer',
            boxShadow: initialized ? 'none' : '0 4px 20px rgba(16,185,129,0.3)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = initialized ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #059669, #047857)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = initialized ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #10b981, #059669)'; }}
        >
          {initialized ? 'NEW GAME' : 'NEW GAME'}
        </button>

        {initialized && (
          <button
            onClick={() => setShowExitConfirm(true)}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10,
              color: '#f87171',
              fontSize: 13,
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.15s',
              marginTop: 4,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Exit to Main Menu (discard save)
          </button>
        )}
      </div>

      {/* Version tag */}
      <div style={{ position: 'absolute', bottom: 20, color: '#1e293b', fontSize: 11 }}>
        v0.1.0 — Early Access
      </div>

      {/* Exit confirm dialog */}
      {showExitConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#1e293b', border: '1px solid #334155',
            borderRadius: 16, padding: 32, width: 380, textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
            <div style={{ color: '#f1f5f9', fontSize: 18, fontFamily: 'Anton, sans-serif', marginBottom: 8 }}>
              EXIT GAME?
            </div>
            <div style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
              Your save data will remain. You can continue later by selecting "Continue Game."
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setShowExitConfirm(false)}
                style={{
                  flex: 1, padding: '12px 20px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid #334155',
                  color: '#94a3b8', cursor: 'pointer', fontSize: 13,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => { exitGame(); setShowExitConfirm(false); }}
                style={{
                  flex: 1, padding: '12px 20px', borderRadius: 8,
                  background: '#ef4444', border: 'none',
                  color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}
              >
                Exit Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
