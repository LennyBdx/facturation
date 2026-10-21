"use server";

import { z } from "zod";
import { runAction } from "@/composition/action";
import type { ActionResult } from "@/lib/action-result";
import { globalSearch, type SearchResult } from "@/services/search";

const querySchema = z.string().max(100);

export async function searchAction(query: string): Promise<ActionResult<SearchResult[]>> {
  return runAction({ schema: querySchema, readOnly: true }, query, async (ctx, q) => ({
    ok: true,
    data: await globalSearch(ctx, q),
  }));
}
