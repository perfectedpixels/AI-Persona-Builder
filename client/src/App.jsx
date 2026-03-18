import React, { useState } from 'react';
import './App.css';
import TabNavigation from './components/TabNavigation';
import AgentBehaviorMaker from './components/AgentBehaviorMaker';

function App() {
  const [activeTab, setActiveTab] = useState('agent-behavior-maker');

  return (
    <div className="App">
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'agent-behavior-maker' && <AgentBehaviorMaker />}
    </div>
  );
}

export default App;
