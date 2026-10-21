/**
 * Point d'entrée unique de la couche de données.
 * Les pages, composants et services n'importent QUE ce module (et `./types`).
 * Pour brancher PostgreSQL : remplacer `createMemoryRepositories(...)` par une
 * implémentation des mêmes interfaces (voir README, « Brancher le back-end »).
 */
import "server-only";
import { createMemoryRepositories, createMemoryUnitOfWork } from "./memory/repositories";
import { createMemoryDb } from "./memory/store";
import { buildSeed } from "./mock/seed";
import type { Repositories, UnitOfWork } from "./repositories";

export type * from "./types";
export type * from "./repositories";
export { NotFoundError } from "./repositories";

import type { MemoryDb } from "./memory/store";

interface DataLayer {
  repositories: Repositories;
  unitOfWork: UnitOfWork;
}

/**
 * Seules les DONNÉES survivent au rechargement à chaud (singleton `globalThis`) ;
 * les repositories sont reconstruits avec le code courant à chaque rechargement du module.
 */
const globalForData = globalThis as unknown as { __factobatDb?: MemoryDb };
let layer: DataLayer | undefined;

/** Implémentations concrètes (racine de composition de la couche de données). */
function dataLayer(): DataLayer {
  if (!layer) {
    const db = (globalForData.__factobatDb ??= createMemoryDb(buildSeed()));
    const repositories = createMemoryRepositories(db);
    layer = { repositories, unitOfWork: createMemoryUnitOfWork(db, repositories) };
  }
  return layer;
}

export function getRepositories(): Repositories {
  return dataLayer().repositories;
}

export function getUnitOfWork(): UnitOfWork {
  return dataLayer().unitOfWork;
}
