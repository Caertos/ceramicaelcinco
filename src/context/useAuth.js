import { useContext } from 'react';
import AuthContext from './_internalAuthContextRef';

// Este archivo expone el hook useAuth separado para mejorar fast refresh.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
export default useAuth;
