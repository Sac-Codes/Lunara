import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AccessDeniedPage } from '../../pages/AccessDeniedPage';
import { useAuth } from '../../providers/AuthProvider';
import { useLunara } from '../../providers/LunaraProvider';

const AuthLoadingShell: React.FC = () => (
  <div
    className="lunara-atmosphere min-h-dvh"
    aria-busy="true"
    aria-label="Checking session"
  />
);

export const RequireAuth: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDataReady } = useLunara();
  const location = useLocation();

  if (isLoading || !isDataReady) {
    return <AuthLoadingShell />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
};

export const RequireAdmin: React.FC = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const { isDataReady } = useLunara();
  const location = useLocation();

  if (isLoading || !isDataReady) {
    return <AuthLoadingShell />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (!isAdmin) {
    return <AccessDeniedPage />;
  }

  return <Outlet />;
};
