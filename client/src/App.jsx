import React from 'react';
import { ThemeProvider, LayoutConfigProvider } from 'rad-ui-package';
import './App.css';
import AgentBehaviorMaker from './components/AgentBehaviorMaker';

function App() {
  return (
    <ThemeProvider>
      <LayoutConfigProvider>
        <div className="App">
          <AgentBehaviorMaker />
        </div>
      </LayoutConfigProvider>
    </ThemeProvider>
  );
}

export default App;
