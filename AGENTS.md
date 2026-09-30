<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## ClearBudget structure
- Shared budget math lives in `src/lib/budget.ts` and period/filter state in `src/lib/useBudget.ts`; pages never recompute 50/30/20 locally, so envelopes stay consistent.
- Supabase reads/writes go through react-query hooks in `src/lib/queries.ts`; AI analysis goes through the server fn `src/lib/insight.functions.ts` so no key reaches the browser.
- User typography is selected through `PrefsProvider` and applied with the root `data-font` attribute so every screen stays visually consistent.
- Sub-categories are per-user rows in the `categories` table (seeded at signup); `secondary_category` stores the category id, resolved via `useCategoryLabel` in `src/lib/categories.ts` (legacy keys still fall back to static labels), so renames apply everywhere.
- The dashboard keeps one route and switches among four local views (overview, forecast, evolution, transactions), preserving the selected budget period and filters between views.
