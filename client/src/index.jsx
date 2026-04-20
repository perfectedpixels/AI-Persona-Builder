import React from 'react';
import ReactDOM from 'react-dom/client';

// Cloudscape global styles
import '@cloudscape-design/global-styles/dark-mode-utils.css';
import '@cloudscape-design/global-styles/index.css';

// RAD design system
import { applyRadTheme } from 'rad-ui-package';
import 'rad-ui-package/styles.css';
import 'rad-ui-package/fonts.css';

import './index.css';
import App from './App';

applyRadTheme();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
