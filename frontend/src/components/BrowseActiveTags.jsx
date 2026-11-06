import FITMENT from "../utils/fitment";
import { FilterTag, TagRow } from "./GlobalStyles/StyleBrowse";

export default function BrowseActiveTags({ tags, onRemove, onClear }) {
  if (tags.length === 0) return null;

  return (
    <TagRow>
      {tags.map((tag) => {
        const fit = FITMENT[tag.fits];
        return (
          <FilterTag
            key={tag.id}
            type="button"
            $background={fit?.background}
            $color={fit?.color}
            aria-label={`Remove filter: ${tag.label}`}
            onClick={() => onRemove(tag.changes)}
          >
            {tag.label} <span aria-hidden="true">✕</span>
          </FilterTag>
        );
      })}
      <button type="button" className="clearLink" onClick={onClear}>
        Clear all
      </button>
    </TagRow>
  );
}
