"use client";

import { useAuth } from './AuthProvider';
import Auth from './Auth';
import CuentasList from './CuentasList';
import FloatingButton from './FloatingButton';

export default function AuthenticatedContent() {
  const { user } = useAuth();

  if (!user) {
    return <Auth />;
  }

  return (
    <>
      <CuentasList />
      <FloatingButton />
    </>
  );
}
