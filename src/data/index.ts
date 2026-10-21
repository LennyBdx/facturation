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

interface DataLayer {
  repositories: Repositories;
  unitOfWork: UnitOfWork;
}

const globalForData = globalThis as unknown as { __factobatData?: DataLayer };

/** Implémentations concrètes (racine de composition de la couche de données). */
function dataLayer(): DataLayer {
  if (!globalForData.__factobatData) {
    const db = createMemoryDb(buildSeed());
    const repositories = createMemoryRepositories(db);
    globalForData.__factobatData = { repositories, unitOfWork: createMemoryUnitOfWork(db, repositories) };
  }
  return globalForData.__factobatData;
}

/** Repositories de l'application (singleton : survit au rechargement à chaud). */
export function getRepositories(): Repositories {
  return dataLayer().repositories;
}

export function getUnitOfWork(): UnitOfWork {
  return dataLayer().unitOfWork;
}
