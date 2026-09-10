import React from 'react';
import { LogOut, UserCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { useToast } from '../../context/ToastContext';

export const Header: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const { success } = useToast();

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'ADMIN', label: 'Admin', desc: 'Full Access' },
    { role: 'SALES', label: 'Sales', desc: 'Customers & Challans' },
    { role: 'WAREHOUSE', label: 'Warehouse', desc: 'Stock & Inward/Outward' },
    { role: 'ACCOUNTS', label: 'Accounts', desc: 'Invoices & Billing' },
  ];

  const handleRoleSwitch = async (role: UserRole) => {
    await switchRole(role);
    success(`Switched role to ${role}`);
  };

  return (
    <header className="top-header">
      {/* 1-Click Role Switcher for Reviewers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          <Sparkles size={14} color="#f59e0b" />
          <span>Role Switcher (RBAC - Role-Based Access Control):</span>
        </div>

        <div className="demo-role-bar">
          {roles.map((r) => {
            const isActive = user?.role === r.role;
            return (
              <button
                key={r.role}
                onClick={() => handleRoleSwitch(r.role)}
                className={`role-pill-btn ${isActive ? 'active' : ''}`}
                title={`${r.label}: ${r.desc}`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* User Profile & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #bfdbfe',
            }}
          >
            <UserCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              {user?.email}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn btn-outline btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626' }}
          title="Sign Out"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
