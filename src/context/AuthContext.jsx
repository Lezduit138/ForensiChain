import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCaseStats } from '../services/caseService';

const AuthContext = createContext(null);

const DEFAULT_USER = {
  id: 'USR-8821',
  name: 'Insp. Rajesh Kumar',
  badgeNumber: 'DL-8821',
  agency: 'Special Cell, Delhi Police / NTRO Forensic Deputation',
  role: 'Investigator', // Investigator | Reviewer | Admin
  clearanceLevel: 'Level-3 Confidential',
  avatar: 'RK',
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('ntro_forensic_user');
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });

  const [activeCaseId, setActiveCaseId] = useState('CASE-2026-0841');
  const [activeCaseFir, setActiveCaseFir] = useState(null);
  const [caseCount, setCaseCount] = useState(0);

  // Refresh live case count on mount
  useEffect(() => {
    getCaseStats().then(stats => {
      if (stats?.active_cases !== undefined) setCaseCount(stats.active_cases);
    });
  }, []);

  const refreshCaseCount = useCallback(() => {
    getCaseStats().then(stats => {
      if (stats?.active_cases !== undefined) setCaseCount(stats.active_cases);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('ntro_forensic_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const switchRole = (newRole, name, badgeNumber) => {
    let agency = 'Cyber Crime Police Station / NTRO';
    if (newRole === 'Reviewer') {
      agency = 'Central Forensic Science Laboratory (CFSL) / NTRO Lab';
    } else if (newRole === 'Admin') {
      agency = 'NTRO Directorate of Digital Forensics & Cyber Command';
    }

    const updated = {
      ...currentUser,
      role: newRole,
      name: name || (newRole === 'Investigator' ? 'Insp. Rajesh Kumar' : newRole === 'Reviewer' ? 'Dr. Sunita Rao' : 'Dr. Arvind Mehra'),
      badgeNumber: badgeNumber || (newRole === 'Investigator' ? 'DL-8821' : newRole === 'Reviewer' ? 'CFSL-SSO-409' : 'NTRO-DIR-001'),
      agency,
    };
    setCurrentUser(updated);
  };

  const logout = () => {
    // Keep user state but allow switching via login screen
  };

  return (
    <AuthContext.Provider value={{ currentUser, switchRole, logout, activeCaseId, setActiveCaseId, activeCaseFir, setActiveCaseFir, caseCount, refreshCaseCount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
