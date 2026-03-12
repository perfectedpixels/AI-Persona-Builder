import React, { useState } from 'react';
import './App.css';
import TabNavigation from './components/TabNavigation';
import ConversationEditor from './components/ConversationEditor';
import AgentBehaviorMaker from './components/AgentBehaviorMaker';

function App() {
  const [activeTab, setActiveTab] = useState('agent-behavior-maker');

  return (
    <div className="App">
      <header className="app-header">
        <h1 className="app-title">Try Demo – Museum Tour App</h1>
      </header>
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === 'conversation-maker' && <ConversationEditor />}
      {activeTab === 'agent-behavior-maker' && <AgentBehaviorMaker />}
    </div>
  );
}

export default App;
