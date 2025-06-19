import React from 'react';
import ReactDOM from 'react-dom/client'; // Note the change here
import './index.css';
import App from './App';

// 1. Create a root element
const root = ReactDOM.createRoot(document.getElementById('root'));

// 2. Render your app into the root
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
