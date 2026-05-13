import { Link, useNavigate, useParams } from "react-router-dom";
import { Boxes, GitCompareArrows } from "lucide-react";
import logo from "../assets/logo.png";
import { usePublicSharedCollection } from "../hooks/usePublicSharedCollection";

export function PublicSharedCollectionPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const { collection, compares, error, loading } =
    usePublicSharedCollection(token);

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 lg:flex">
      {/* Sidebar */}
      <aside className="flex shrink-0 flex-col border-b border-zinc-200 bg-white lg:h-screen lg:w-72 lg:sticky lg:top-0 lg:border-b-0 lg:border-r">
        <div className="border-b border-zinc-200 px-4 py-3">
          <img
            alt="Who Changed the Response logo"
            className="h-10 w-36 object-contain"
            src={logo}
          />
        </div>

        {loading ? (
          <p className="px-4 py-3 text-sm text-zinc-400">Loading…</p>
        ) : error || !collection ? null : (
          <>
            <div className="border-b border-zinc-200 px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
                Collection
              </p>
              <h1 className="mt-1 truncate text-sm font-semibold text-zinc-950">
                {collection.name}
              </h1>
              <p className="mt-0.5 text-xs text-zinc-500">
                {compares.length}{" "}
                {compares.length === 1 ? "compare" : "compares"} · Read only
              </p>
            </div>

            <nav className="flex-1 overflow-y-auto py-2">
              {compares.length === 0 ? (
                <p className="px-4 py-2 text-xs text-zinc-400">
                  No compares yet
                </p>
              ) : (
                compares.map((compare) => (
                  <button
                    className="flex w-full items-center px-4 py-1.5 text-left text-xs font-medium text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900"
                    key={compare.id}
                    onClick={() =>
                      navigate(
                        `/shared/collections/${token}/compares/${compare.id}`,
                      )
                    }
                    type="button"
                  >
                    <span className="truncate">{compare.name}</span>
                  </button>
                ))
              )}
            </nav>
          </>
        )}
      </aside>

      {/* Main */}
      <section className="flex min-h-screen flex-1 flex-col">
        {/* Topbar */}
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-600">
            <Boxes aria-hidden="true" size={16} />
            <span className="max-w-64 truncate">
              {loading ? "Loading…" : collection?.name ?? "Collection"}
            </span>
          </div>
          <Link
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-50 shadow-sm transition hover:bg-zinc-800"
            to="/"
          >
            Open app
          </Link>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col px-4 py-4">
          {loading ? (
            <div className="flex flex-1 items-center justify-center py-24">
              <p className="text-sm font-medium text-zinc-400">
                Loading shared collection…
              </p>
            </div>
          ) : error || !collection ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error || "Shared collection not found."}
            </div>
          ) : compares.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
              <GitCompareArrows
                aria-hidden="true"
                className="text-zinc-300"
                size={40}
              />
              <p className="mt-4 text-base font-semibold text-zinc-950">
                No compares in this collection
              </p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
              <GitCompareArrows
                aria-hidden="true"
                className="text-zinc-300"
                size={40}
              />
              <p className="mt-4 text-base font-semibold text-zinc-950">
                Select a compare from the sidebar
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {compares.length}{" "}
                {compares.length === 1 ? "compare" : "compares"} in this
                collection
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
