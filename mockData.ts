
import { UserRole, User, Toner, Unit, UnitToner, UnitSector, Transaction, TransactionType, TonerRequest, RequestStatus } from './types';

export const initialUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    displayName: 'System Admin',
    email: 'admin@tonman.com',
    role: UserRole.ADMIN,
    permissions: ['all'],
  },
  {
    id: '2',
    username: 'suporte_1',
    displayName: 'Carlos Support',
    email: 'carlos@tonman.com',
    role: UserRole.SUPPORT,
    unitId: 'u1',
    permissions: ['edit_stock', 'approve_requests'],
  },
];

export const initialToners: Toner[] = [
  { id: 't1', model: 'TN-514K', color: 'Preto', active: true },
  { id: 't2', model: 'TN-514C', color: 'Ciano', active: true },
  { id: 't3', model: 'TN-514M', color: 'Magenta', active: true },
  { id: 't4', model: 'TN-514Y', color: 'Amarelo', active: true },
  { id: 't5', model: 'W9040MC', color: 'Preto', active: true },
];

export const initialUnits: Unit[] = [
  { id: 'u1', name: 'Sede Principal', displayOrder: 1 },
  { id: 'u2', name: 'Almoxarifado Central', displayOrder: 2 },
  { id: 'u3', name: 'Unidade Norte', displayOrder: 3 },
];

export const initialUnitToners: UnitToner[] = [
  { id: 'ut1', unitId: 'u1', tonerId: 't1', quantity: 15, minStockAlert: 5, isActive: true },
  { id: 'ut2', unitId: 'u1', tonerId: 't2', quantity: 4, minStockAlert: 5, isActive: true },
  { id: 'ut3', unitId: 'u2', tonerId: 't1', quantity: 50, minStockAlert: 10, isActive: true },
];

export const initialSectors: UnitSector[] = [
  { id: 's1', unitId: 'u1', name: 'TI' },
  { id: 's2', unitId: 'u1', name: 'RH' },
  { id: 's3', unitId: 'u2', name: 'Logística' },
];

export const initialTransactions: Transaction[] = [
  { id: 'tr1', type: TransactionType.ADD, quantity: 10, reason: 'Compra mensal', userId: '1', tonerId: 't1', unitId: 'u1', timestamp: new Date().toISOString() },
  { id: 'tr2', type: TransactionType.REMOVE, quantity: 1, reason: 'Troca setor TI', userId: '2', tonerId: 't1', unitId: 'u1', timestamp: new Date().toISOString() },
];

export const initialRequests: TonerRequest[] = [
  { id: 'rq1', status: RequestStatus.PENDING, quantity: 2, sectorName: 'Jurídico', requestorId: '2', tonerId: 't2', unitId: 'u1', timestamp: new Date().toISOString() },
];
