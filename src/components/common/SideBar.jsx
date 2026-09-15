import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FolderLock,
  HardDriveUpload,
  Video,
  Link2,
  FileCheck2,
  ShieldAlert,
  Server,
  KeyRound,
  FileText
} from 'lucide-react';

export const SideBar = () => {
  const { currentUser, activeCaseId } = useAuth();
  const location = useLocation();

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Case Repository',
      path: '/cases',
      icon: FolderLock,
      badge: '5 Cases',
    },
    {
      name: 'Active Case Detail',
      path: `/cases/${activeCaseId}`,
      icon: FileText,
      badge: 'FIR 412',
    },
    {
      name: 'Ingest Evidence',
      path: `/cases/${activeCaseId}/ingest`,
      icon: HardDriveUpload,
      badge: 'Multi-Vendor',
    },
    {
      name: 'Analysis Workspace',
      path: `/cases/${activeCaseId}/evidence/EVD-841-01`,
      icon: Video,
      badge: 'Centerpiece',
      highlight: true,
    },
    {
      name: 'Chain of Custody',
      path: `/cases/${activeCaseId}/custody`,
      icon: Link2,
      badge: 'Ledger',
    },
    {
      name: 'Court Report (Sec 65B)',
      path: `/cases/${activeCaseId}/report`,
      icon: FileCheck2,
      badge: 'BSA Cert',
    },
  ];

  if (currentUser.role === 'Admin') {
    navItems.push({
      name: 'Admin Panel',
      path: '/admin',
      icon: Server,
      badge: 'Vendor Lib',
    });
  }

  // Filter out Ingest Evidence for Reviewers (read-only role)
  const visibleNavItems = currentUser.role === 'Reviewer'
    ? navItems.filter(item => !item.path.includes('/ingest'))
    : navItems;

  return (
    <aside className="w-64 bg-forensic-950 border-r border-forensic-border flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Branding */}
        <div className="p-4 border-b border-forensic-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-forensic-900 border border-forensic-cyan/40 flex items-center justify-center text-forensic-cyan shadow-glow-cyan">
            <ShieldAlert className="w-6 h-6 text-forensic-cyan" />
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-wider text-slate-100 uppercase">
              NTRO FORENSICS
            </div>
            <div className="text-[10px] text-forensic-cyan font-mono tracking-tight">
              DVR/NVR Forensic Engine
            </div>
          </div>
        </div>

        {/* Section: Evidentiary Navigation */}
        <div className="px-3 py-4">
          <div className="text-[10px] font-mono uppercase text-slate-400 px-3 mb-2 tracking-wider">
            Forensic Workflows
          </div>
          <nav className="space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                (item.path.includes('/cases/') && location.pathname === item.path);

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive: linkActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all group ${
                      linkActive
                        ? 'bg-forensic-800 text-forensic-cyan border-l-2 border-forensic-cyan font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-forensic-900'
                    } ${item.highlight ? 'border border-forensic-cyan/20' : ''}`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-forensic-cyan' : 'text-slate-400 group-hover:text-slate-200'
                    }`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      item.highlight
                        ? 'bg-forensic-cyan/15 text-forensic-cyan border border-forensic-cyan/30'
                        : 'bg-forensic-900 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer System Status & Compliance Badge */}
      <div className="p-3 border-t border-forensic-border bg-forensic-900/50">
        <div className="bg-forensic-950 p-2.5 rounded border border-forensic-border space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Cryptographic Engine:</span>
            <span className="text-emerald-400 font-mono text-[10px] font-semibold">ENFORCED</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Active Vendor Engine:</span>
            <span className="text-forensic-cyan font-mono text-[10px]">HIK-FS / DHAV / CP</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Session Role:</span>
            <span className="text-amber-300 font-mono text-[10px] uppercase">{currentUser.role}</span>
          </div>
        </div>

        <div className="mt-2 text-[10px] text-slate-400 text-center font-mono">
          NTRO FORENSICS • BSA 2023 / SEC 65B CERTIFIED
        </div>
      </div>
    </aside>
  );
};
