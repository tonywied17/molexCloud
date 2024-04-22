import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom'; 
import './App.css';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="App">
      <Router>
        <Dashboard /> 
      </Router>
    </div>
  );
}

export default App;
