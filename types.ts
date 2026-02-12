
export enum UserRole {
  ADMIN = 'admin',
  SUPPORT = 'support',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

export enum TransactionType {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT'
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  phone?: string;
  role: UserRole;
  unitId?: string;
  sectorId?: string;
  permissions: string[];
}

export interface Toner {
  id: string;
  model: string;
  color: string;
  active: boolean;
}

export interface Unit {
  id: string;
  name: string;
  displayOrder: number;
}

export interface UnitToner {
  id: string;
  unitId: string;
  tonerId: string;
  quantity: number;
  minStockAlert: number;
  isActive: boolean;
}

export interface UnitSector {
  id: string;
  unitId: string;
  name: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  quantity: number;
  reason: string;
  userId: string;
  tonerId: string;
  unitId: string;
  timestamp: string;
}

export interface TonerRequest {
  id: string;
  status: RequestStatus;
  quantity: number;
  sectorName: string;
  requestorId: string;
  tonerId: string;
  unitId: string;
  timestamp: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
