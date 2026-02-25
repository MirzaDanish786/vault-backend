export * from './store.type';
export * from './store.validator';
export * from './store.service';

import { StoreService } from './store.service';

export const storeService = new StoreService();
