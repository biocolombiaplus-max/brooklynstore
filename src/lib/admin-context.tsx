'use client';

import { createContext, useContext } from 'react';
import type { User } from 'firebase/auth';

export const AdminContext = createContext<User | null>(null);

export function useAdminUser(): User | null {
  return useContext(AdminContext);
}
