import { Link, useSearchParams } from "react-router-dom";
import usePagination from "@mui/material/usePagination";
import { CompactPages, NumberedPages } from "./GlobalStyles/StyleBrowse";

// Real links, so pages can be opened in a new tab and the back button works.
// Both layouts are in the page, and CSS shows the one that fits the screen.
export default function BrowsePagination({ page, pageCount }) {
  const [searchParams] = useSearchParams();
  const { items } = usePagination({ count: pageCount, page });

  if (pageCount <= 1) return null;

  const hrefFor = (target) => {
    const params = new URLSearchParams(searchParams);
    // Page 1 is the default, so it stays out of the URL.
    if (target > 1) params.set("page", target);
    else params.delete("page");
    const query = params.toString();
    return query ? `?${query}` : "?";
  };

  const previous = page > 1 ? hrefFor(page - 1) : null;
  const next = page < pageCount ? hrefFor(page + 1) : null;

  return (
    <>
      <NumberedPages aria-label="Pages">
        {items.map((item) => {
          if (item.type === "start-ellipsis" || item.type === "end-ellipsis") {
            return (
              <span key={item.type} className="ellipsis" aria-hidden="true">
                …
              </span>
            );
          }
          if (item.type === "previous" || item.type === "next") {
            const label = item.type === "previous" ? "‹ Prev" : "Next ›";
            return item.disabled ? (
              <span key={item.type} className="disabled">
                {label}
              </span>
            ) : (
              <Link key={item.type} to={hrefFor(item.page)}>
                {label}
              </Link>
            );
          }
          return (
            <Link
              key={item.page}
              to={hrefFor(item.page)}
              aria-label={`Page ${item.page}`}
              aria-current={item.selected ? "page" : undefined}
            >
              {item.page}
            </Link>
          );
        })}
      </NumberedPages>
      <CompactPages aria-label="Pages">
        {previous ? (
          <Link to={previous}>‹ Prev</Link>
        ) : (
          <span className="disabled">‹ Prev</span>
        )}
        <span className="current">
          Page {page} of {pageCount}
        </span>
        {next ? <Link to={next}>Next ›</Link> : <span className="disabled">Next ›</span>}
      </CompactPages>
    </>
  );
}
