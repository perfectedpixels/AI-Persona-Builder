import React from 'react';
import './TabNavigation.css';

const TabNavigation = ({ activeTab, onTabChange }) => {
  return (
    <div className="tab-navigation">
      <button
        className={`tab-button ${activeTab === 'agent-behavior-maker' ? 'active' : ''}`}
        onClick={() => onTabChange('agent-behavior-maker')}
      >
        🤖 Agent Behavior Maker
      </button>
      {/* Conversation Maker tab disabled for now */}
    </div>
  );
};

export default TabNavigation;
