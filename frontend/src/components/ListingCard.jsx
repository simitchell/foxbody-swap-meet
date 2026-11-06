import { Link } from "react-router-dom";
import { Card, PriceBadge, ConditionDot } from "./GlobalStyles/StyleCard";
import conditionColor from "../utils/conditionColor";
import { formatPrice } from "../utils/formatPrice";
import FitTag from "./FitTag";

// One listing tile, linking to its detail page. Used by the homepage, search
// results, and "Your Listings", so the card looks the same everywhere and is
// only changed in one place. Render these inside a <CardContainer> grid.
//
// ownerMeta: an optional last row. Only "Your Listings" passes one.
export default function ListingCard({ listing, ownerMeta }) {
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
            <PriceBadge>{formatPrice(listing.price)}</PriceBadge>
            <span className="conditionRow">
              <ConditionDot color={conditionColor(listing.condition)} />
              {listing.condition}
            </span>
          </div>
          {/* Always rendered: its reserved height keeps a listing with neither
              value set the same size as the cards beside it. */}
          <div className="cardFit">
            {listing.category_label && (
              <span className="cardCategory">{listing.category_label}</span>
            )}
            <FitTag fits={listing.fits} />
          </div>
          {ownerMeta}
        </div>
      </Card>
    </Link>
  );
}
