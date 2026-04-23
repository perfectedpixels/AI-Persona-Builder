import React, { useState } from 'react';
import { Settings, Sun, Moon, Monitor, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import type { RadLayoutProps } from '../types/types';
import '../styles/Layout.css';

export default function RadLayout({ items, activeKey, onNavigate, children, chatBar }: RadLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { mode, preference, setPreference } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="layout" data-theme={mode}>
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-content">
          <div className="sidebar-top">
            <button
              className="sidebar-logo-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
            <div className="sidebar-divider" />
          </div>

          <div className="sidebar-middle">
            {items.map((item) => (
              <button
                key={item.key}
                className={`sidebar-icon-btn ${activeKey === item.key ? 'selected' : ''}`}
                onClick={() => !item.disabled && onNavigate(item.key)}
                style={{ opacity: item.disabled ? 0.4 : 1, cursor: item.disabled ? 'default' : 'pointer' }}
                title={item.label}
              >
                {item.icon}
                {sidebarOpen && <span className="sidebar-label">{item.label}</span>}
                {item.badge && (
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: '#33bbef' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="sidebar-bottom">
            <div className="sidebar-settings-wrapper">
              <button
                className={`sidebar-icon-btn ${settingsOpen ? 'selected' : ''}`}
                onClick={() => setSettingsOpen(!settingsOpen)}
                aria-label="Settings"
              >
                <Settings size={16} />
                {sidebarOpen && <span className="sidebar-label">Settings</span>}
              </button>
              {settingsOpen && (
                <div className="settings-popover">
                  <div className="settings-popover-header">Appearance</div>
                  <div className="settings-theme-options">
                    {(['light', 'dark', 'system'] as const).map((p) => (
                      <button
                        key={p}
                        className={`settings-theme-btn ${preference === p ? 'active' : ''}`}
                        onClick={() => {
                          setPreference(p);
                          setSettingsOpen(false);
                        }}
                      >
                        {p === 'light' ? <Sun size={14} /> : p === 'dark' ? <Moon size={14} /> : <Monitor size={14} />}
                        {' '}
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="sidebar-user-section">
              <button className="sidebar-user-btn" aria-label="User menu">
                <div className="sidebar-user-avatar"><User size={18} /></div>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-wrapper">
        <div className="content-area">
          <main className="main-content">{children}</main>
        </div>
        {chatBar && (
          <div className="chat-bar">
            <div className="chat-bar-inner">{chatBar}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export { RadLayout };
