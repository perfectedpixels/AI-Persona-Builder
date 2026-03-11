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
      <button
        className={`tab-button ${activeTab === 'conversation-maker' ? 'active' : ''}`}
        onClick={() => onTabChange('conversation-maker')}
      >
        🎭 Conversation Maker
      </button>
    </div>
  );
};

export default TabNavigation;
