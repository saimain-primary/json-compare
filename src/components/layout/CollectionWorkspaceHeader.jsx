import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-xs mt-4">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <ChevronRight
              aria-hidden="true"
              className="shrink-0 text-zinc-400"
              size={14}
            />
          )}
          {item.to ? (
            <Link
              className="shrink-0 font-medium text-xs text-violet-700 transition hover:text-violet-900"
              to={item.to}
            >
              {item.label}
            </Link>
          ) : (
            <span
              aria-current="page"
              className="truncate font-semibold text-xs text-zinc-900"
            >
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
