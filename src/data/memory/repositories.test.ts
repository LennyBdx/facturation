import { describeRepositoryContract } from "../contract/repository-contract";
import { buildSeed } from "../mock/seed";
import { createMemoryRepositories, createMemoryUnitOfWork } from "./repositories";
import { createMemoryDb } from "./store";

describeRepositoryContract("mémoire", async () => {
  const db = createMemoryDb(buildSeed());
  const repos = createMemoryRepositories(db);
  const orgs = [...db.organizations.keys()];
  return { repos, uow: createMemoryUnitOfWork(db, repos), orgA: orgs[0], orgB: orgs[1] };
});
