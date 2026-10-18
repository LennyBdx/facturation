/**
 * Point d'entrée unique de la couche de données.
 * Les pages, composants et services n'importent QUE ce module (et `./types`).
 * Pour brancher PostgreSQL : remplacer `createMemoryRepositories(...)` par une
 * implémentation des mêmes interfaces (voir README, « Brancher le back-end »).
 */
import { createMemoryRepositories } from "./memory/repositories";
import { createMemoryDb } from "./memory/store";
import { buildSeed } from "./mock/seed";
import type { Repositories } from "./repositories";

export type * from "./types";
export type * from "./repositories";
export { NotFoundError } from "./repositories";

const globalForData = globalThis as unknown as { __situaRepositories?: Repositories };

/** Repositories de l'application (singleton : survit au rechargement à chaud). */
export function getRepositories(): Repositories {
  globalForData.__situaRepositories ??= createMemoryRepositories(createMemoryDb(buildSeed()));
  return globalForData.__situaRepositories;
}
