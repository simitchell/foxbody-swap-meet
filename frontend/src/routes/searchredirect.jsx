import { Navigate, useParams } from "react-router-dom";

// The old search page's URLs, kept working for existing links and bookmarks.
export default function SearchRedirect() {
  const { search } = useParams();
  const query = search ? `?${new URLSearchParams({ q: search })}` : "";
  return <Navigate to={`/browse${query}`} replace />;
}
