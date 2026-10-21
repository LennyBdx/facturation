import { getRequestContext } from "@/composition/request-context";
import { EXPORT_LISTS, type ExportList } from "@/config/routes";
import { buildCsvExport } from "@/features/lists/csv-exports";

/** Export CSV d'une liste, avec la recherche, le filtre et le tri de l'écran (sans pagination). */
export async function GET(request: Request, { params }: { params: Promise<{ liste: string }> }) {
  const { liste } = await params;
  if (!EXPORT_LISTS.includes(liste as ExportList)) {
    return new Response("Liste inconnue.", { status: 404 });
  }
  const ctx = await getRequestContext();
  const search = new URL(request.url).searchParams;
  const { filename, content } = await buildCsvExport(ctx, liste as ExportList, {
    q: search.get("q") ?? undefined,
    filtre: search.get("filtre") ?? undefined,
    tri: search.get("tri") ?? undefined,
  });
  return new Response(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}-${ctx.today}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
