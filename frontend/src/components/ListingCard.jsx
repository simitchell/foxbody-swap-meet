import { Link } from "react-router-dom";
import { Card, PriceBadge, ConditionDot } from "./GlobalStyles/StyleCard";
import conditionColor from "../utils/conditionColor";

// One listing tile, linking to its detail page. Used by the homepage, search
// results, and "Your Listings", so the card looks the same everywhere and is
// only changed in one place. Render these inside a <CardContainer> grid.
//
// showSeller: false on "Your Listings", where the seller is always you.
export default function ListingCard({ listing, showSeller = true }) {
  return (
    <Link to={`/listingdetail/${listing.id}`}>
      {/* "card" is the class CardContainer's hover shadow looks for. */}
      <Card className="card">
        <div className="cardImage">
          <img src={listing.image_url} alt={listing.title} />
        </div>
        <div className="cardBody">
          <h2>{listing.title}</h2>
          <div className="cardMeta">
            <PriceBadge>${listing.price}</PriceBadge>
            <span className="conditionRow">
              <ConditionDot color={conditionColor(listing.condition)} />
              {listing.condition}
            </span>
          </div>
          {showSeller && (
            <p className="seller">
              {listing.username}
              {listing.seller_state && ` · ${listing.seller_state}`}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}
