"""Hand-written data for the seed_dev_data command. Local dev only."""

# Every seeded account uses this domain, which is how --flush finds them. It's
# under example.com, which is reserved, so no mail can reach a real person. It
# can't match plain @example.com test accounts like alice and bob.
SEED_EMAIL_DOMAIN = "seed.example.com"

# All seeded users share this password, so any of them can log in.
SEED_PASSWORD = "foxbody-dev-123"

# A known login with a full profile and a few listings, for quick checks.
DEMO_USERNAME = "seed_demo"
DEMO_LISTINGS = 6

# How many users get cart items (the demo user plus others), and how many each.
CART_USERS = 4
CART_ITEMS_RANGE = (1, 4)

# Share of profiles in each state of completeness.
FULL_PROFILE_SHARE = 0.60
PARTIAL_PROFILE_SHARE = 0.25

USERNAMES = [
    "notchback_88", "gt_mike", "cobra_jen", "lx_5point0", "hatchback_hank",
    "svo_steve", "foxbody_fran", "t5_tommy", "gt40_gary", "pony_wheels_pete",
    "coupe_carla", "ssp_sam", "fourEyed_fred", "302_rick", "boost_brenda",
    "autox_alex", "drag_dave", "trackday_tina", "saleen_sal", "convertible_connie",
    "rustfree_ray", "mm_kmember", "eighty_seven_gt", "ninety_lx", "ninetythree_cobra",
    "garage_greg", "weekend_wes", "pushrod_paula", "smog_free_stan", "carb_carl",
    "lsd_larry", "hooker_headers", "rolling_chassis", "swap_meet_sue", "turbine_ted",
    "stangbanger_bo", "rearend_randy", "clutch_cody", "fox_nation_nate", "mustang_mel",
    "tri_bar_tim", "shaker_shane", "cragar_cal", "vert_vicky", "blown_ben",
]

FIRST_NAMES = [
    "Mike", "Jen", "Hank", "Steve", "Fran", "Tommy", "Gary", "Pete", "Carla",
    "Sam", "Fred", "Rick", "Brenda", "Alex", "Dave", "Tina", "Sal", "Connie",
    "Ray", "Greg", "Wes", "Paula", "Stan", "Carl", "Larry", "Sue", "Ted", "Bo",
]

LAST_NAMES = [
    "Hollis", "Whitfield", "Barnes", "Lindqvist", "Odom", "Pruitt", "Tanaka",
    "McCray", "Delgado", "Rhodes", "Sutton", "Vance", "Kowalski", "Hutchins",
    "Boyd", "Ferris", "Nguyen", "Coleman", "Ingram", "Yates",
]

# (city, state, ZIP): mostly the Southeast, with a few from elsewhere.
PLACES = [
    ("Greenville", "SC", "29601"), ("Spartanburg", "SC", "29302"),
    ("Columbia", "SC", "29201"), ("Charleston", "SC", "29403-5021"),
    ("Charlotte", "NC", "28205"), ("Asheville", "NC", "28801"),
    ("Raleigh", "NC", "27603"), ("Atlanta", "GA", "30316"),
    ("Savannah", "GA", "31401"), ("Macon", "GA", "31201"),
    ("Knoxville", "TN", "37917"), ("Nashville", "TN", "37206"),
    ("Chattanooga", "TN", "37405"), ("Birmingham", "AL", "35205"),
    ("Huntsville", "AL", "35801"), ("Tampa", "FL", "33604"),
    ("Jacksonville", "FL", "32205"), ("Orlando", "FL", "32803"),
    ("Richmond", "VA", "23220"), ("Roanoke", "VA", "24011"),
    ("Louisville", "KY", "40204"), ("Dallas", "TX", "75208"),
    ("Dearborn", "MI", "48124"), ("Columbus", "OH", "43206"),
    ("Sacramento", "CA", "95816"), ("Phoenix", "AZ", "85004"),
]

STREETS = [
    "412 Oak Ridge Rd", "1187 Pinecrest Dr", "76 Mill Village Ln",
    "2301 Augusta St", "9 Cedar Hollow Ct", "540 Old Farm Rd",
    "1620 Laurel Ave", "38 Depot St", "815 Cotton Gin Way",
    "2744 Hickory Bluff Dr", "103 Tanner Pl", "667 Stonewall Ave",
]

BIOS = [
    "Running a '90 LX hatch, slowly turning it into a weekend autocross car.",
    "Bought my '87 GT new and never sold it. Selling what I've replaced along the way.",
    "Four-eyed coupe guy. If it's from '79 to '86 I probably have one in the shed.",
    "Third fox body so far. This one's getting a T-5 swap once I find a good one.",
    "Mostly drag strip. 8.8 rear, 3.73s, and a small budget.",
    "Wrenching on an '89 notch with my kid. Parting out a rust bucket to fund it.",
    "Stock-appearing sleeper is the goal.",
    "Former Ford tech. Happy to answer questions about anything on the listings.",
    "'93 Cobra owner, so please don't ask if it's for sale.",
    "Convertible cruiser on weekends, no plans to go fast.",
    "Collecting NOS trim for a full factory-correct '88 LX restoration.",
    "SSP fan. Still hunting for the right door panels.",
    "Autocross, track days, and too many sets of wheels.",
    "Just got into fox bodies last year and I already need a bigger garage.",
    "Road racing a stripped '91 coupe. Everything I sell has been upgraded, not worn out.",
]

# Exactly Profile.bio's max_length (400), to test the longest bio in the UI.
LONGEST_BIO = (
    "Bought my first fox body in high school, an '84 hatch with a tired 302 and "
    "a hole in the floor, and I've owned one ever since. These days it's a '90 "
    "LX notchback with GT40 heads, a Pro 5.0 shifter, and a Maximum Motorsports "
    "K-member that took three weekends and a lot of swearing. I sell what I "
    "swap out, I describe it honestly, and I ship fast. Ask me anything about "
    "T-5s or this hobby. Cheers, all!"
)

# How listings are spread across users, as shares of the user count. One extra
# user is the "power seller"; everyone left over gets a few listings.
ZERO_LISTINGS_SHARE = 0.20
MANY_LISTINGS_SHARE = 0.32
POWER_SELLER_LISTINGS = 20
MANY_LISTINGS_RANGE = (8, 10)
FEW_LISTINGS_RANGE = (1, 4)
MAX_LISTING_PRICE = 4500

# About 5% of listings have neither Category nor Fits, and about 5% have no
# created_at, like real listings from before those fields existed.
NOT_SET_SHARE = 0.05
NO_DATE_SHARE = 0.05

# Listings with a later bumped_at than created_at, as a past paid bump would
# leave them, and how recent those bumps are.
BUMPED_LISTINGS = 3
BUMPED_WITHIN_DAYS = 7
BUMPED_MIN_AGE_DAYS = 14

# Days since posting for the demo user's listings, so one login shows every
# state. None is a listing with no date, which is also left Not set. 60 is the
# first stale age.
DEMO_LISTING_AGES = (None, 0, 20, 59, 60, 200)
DEMO_NO_DATE_BUMP_AGE_DAYS = 30

# A long price needs the longest condition to test the phone card's wrap.
LONG_PRICE_FROM = 10000
LONG_PRICE_CONDITION = "great"

# Placeholder image background for each category: muted, so white text reads.
CATEGORY_COLORS = {
    "Engine": (122, 62, 56),
    "Drivetrain": (66, 86, 110),
    "Suspension": (74, 102, 82),
    "Body": (112, 88, 54),
    "Interior": (88, 72, 108),
    "Wheels": (84, 88, 92),
    "Other": (70, 96, 104),
}

# (category, image label, title, whole-dollar price, description). Price is an
# integer on the model. Descriptions stop at 250, the forms' limit.
LISTINGS = [
    ("Engine", "GT40 Heads", "Ford GT40 iron heads, freshly rebuilt", 650,
     "Pair of GT40 iron heads with new valve seals and springs. Pulled from a '94 Explorer and cleaned up. Good flow for a stock-bottom-end 302."),
    ("Engine", "E303 Cam", "E303 camshaft with lifters", 175,
     "Under 10k miles on it. Lobes look perfect. Comes with the matching lifters, kept in order."),
    ("Engine", "65mm TB", "65mm throttle body", 140,
     "Polished 65mm throttle body off my '89 GT. Works with the stock EGR spacer."),
    ("Engine", "24lb Injectors", "24 lb/hr fuel injectors, set of 8", 120,
     "Flow tested and cleaned last spring. Good match for a mild 5.0 with a larger mass air meter."),
    ("Engine", "Mass Air", "Pro-M 75mm mass air meter", 265,
     "Calibrated for 24s. Selling because I went up in size."),
    ("Engine", "Headers", "Long tube headers for 5.0 fox, ceramic coated", 340,
     "Coating has some chips near the collectors but no cracks. Bolts right up to a T-5 car with stock motor mounts."),
    ("Engine", "Intake", "Edelbrock Performer RPM intake", 310,
     "Upper and lower. No corrosion in the runners. Gaskets not included."),
    ("Engine", "Radiator", "Aluminum 2-row radiator", 150,
     "Fits '79-'93. No leaks. A couple of bent fins."),
    ("Engine", "Long Block", "Complete 5.0 HO long block, 92k miles, ran great when pulled, compression numbers available", 1200,
     "Pulled from a running '91 LX for a bigger engine. Even compression across all eight. Sold as a long block with heads and intake, no accessories or wiring. Pickup preferred because of the weight, though freight can be arranged."),
    ("Engine", "Valve Covers", "Cobra valve covers", 95,
     "Good paint. One small scuff."),
    ("Engine", "Oil Pan", "Canton 7qt road race oil pan", 285,
     "Baffled pan that stayed dry through two seasons of track days."),
    ("Drivetrain", "Cobra Swap", "Complete '93 Cobra engine and T-5 swap, 38k miles", 12500,
     "Everything from a wrecked '93 Cobra: engine, T-5, wiring, computer, and accessories. Ran perfectly before the wreck, and compression numbers are in the photos."),
    ("Drivetrain", "T-5 Package", "World Class T-5 with new clutch, flywheel, and aluminum bellhousing package", 4500,
     "Everything for a complete swap: rebuilt T-5, new clutch, flywheel, bellhousing, driveshaft, crossmember, pedal assembly, and shifter. Bench tested after the rebuild and stored on a pallet. Serious buyers only, please. Local pickup in person is ideal."),
    ("Drivetrain", "T-5", "T-5 transmission, 3.35 first gear", 850,
     "Shifts clean through all five. No grinding going into third. Removed for a TKO swap."),
    ("Drivetrain", "8.8 Rear", "8.8 rear end with 3.73 gears and new clutch packs", 950,
     "Complete axle, drum to drum. Traction-Lok was rebuilt about 5k miles ago. No whine at highway speed."),
    ("Drivetrain", "Full Rear End", "Full 8.8 rear end, 31-spline axles, 4.10s, disc brake conversion", 2400,
     "Built for the strip and never finished the car. Moser axles, 4.10 gears, and a rear disc conversion with new pads. Under 500 miles on all of it."),
    ("Drivetrain", "Pro 5.0", "Pro 5.0 short throw shifter", 165,
     "Tight and quiet. Includes the stock shifter handle."),
    ("Drivetrain", "Driveshaft", "Aluminum driveshaft", 225,
     "Balanced two years ago. Fits T-5 cars."),
    ("Drivetrain", "Clutch Cable", "Adjustable clutch cable and quadrant", 60,
     "Billet quadrant, firewall adjuster, and cable. Used for one season."),
    ("Drivetrain", "Gears", "3.55 ring and pinion for 8.8", 110,
     "Pattern looked good when it came out. No chips."),
    ("Suspension", "K-Member", "Maximum Motorsports K-member", 780,
     "Tubular K-member with the bolts. Saved a good bit of weight up front. No cracks and no bends."),
    ("Suspension", "Connectors", "Subframe connectors, weld-in", 130,
     "Never installed. Primer only. Bought two sets by mistake."),
    ("Suspension", "Bilsteins", "Bilstein struts and shocks, set of 4", 320,
     "About 15k street miles. No leaks. Ride is firm but not harsh."),
    ("Suspension", "Coilovers", "Front coilover conversion kit", 540,
     "Complete kit with springs and adjustable perches. Removes a lot of the nose-heavy feel in corners."),
    ("Suspension", "Control Arms", "Boxed lower control arms", 145,
     "Powder coated black. New bushings installed last year."),
    ("Suspension", "Sway Bar", "Stock GT rear sway bar", 40,
     "Pulled from a parts car."),
    ("Suspension", "Caster Plates", "Caster/camber plates", 190,
     "Good for getting real alignment numbers at the track. Light surface rust on one bolt."),
    ("Suspension", "Lowering Springs", "Lowering springs, about 1.5 inches", 85,
     "Clean with no sag. Includes the original rubber isolators."),
    ("Suspension", "Bump Steer", "Bump steer kit", 75,
     "Used for about 5,000 miles. Good threads."),
    ("Body", "Rolling Shell", "Rust-free '90 LX hatch rolling shell with clean title", 11750,
     "Georgia car its whole life. No rust in the floors or strut towers. Comes on steel wheels with no engine or transmission. Fresh paint in the original color."),
    ("Body", "Bezels", "Four-eye headlight bezels, pair", 65,
     "Both tabs intact on each side. Paint is faded but there are no cracks."),
    ("Body", "Cobra R Hood", "Cobra R style fiberglass hood", 420,
     "Needs prep and paint. Fits well. Includes pins but no latch. Stored indoors."),
    ("Body", "Ground Effects", "GT ground effects, complete set, for '87-'93 GT hatch or coupe with all clips and original hardware", 575,
     "Front bumper cover, rockers, and rear bumper cover from a '90 GT. Original paint with road rash on the lower front. No cracks at any mounting points. A rare complete set that has been kept together since the car was parted out."),
    ("Body", "Saleen Wing", "Saleen style rear wing", 260,
     "Fits hatch. Some scratches in the paint. No cracks."),
    ("Body", "LX Taillights", "LX taillights, pair", 125,
     "No haze or cracks. Connectors included."),
    ("Body", "Hood", "Hood", 180,
     "Straight."),
    ("Body", "Trim Clip", "Door panel trim clip", 5,
     "One clip. Yes, really."),
    ("Body", "Fender", "Passenger side front fender, '87-'93", 90,
     "Rust free from a Georgia car. Small door ding near the top."),
    ("Body", "Headlights", "Aero headlight assemblies", 140,
     "Clear lenses, not yellowed. All the adjuster clips are intact."),
    ("Body", "Door", "Driver side door, notchback", 200,
     "Solid with no rot in the bottom seam. Includes glass and the regulator."),
    ("Body", "Louvers", "Rear window louvers", 110,
     "Black finish, hatch only. Hardware included, but the mounting tabs are a little loose."),
    ("Body", "Antenna", "Stock power antenna", 25,
     "Works. Mast is a little bent."),
    ("Interior", "Recaro Seats", "Recaro seats, front pair with original brackets", 950,
     "Factory option seats from an SVO. Bolsters are worn on the driver side and the passenger side is near perfect. Includes the original brackets, sliders, and headrests. Would make an ideal start for a period-correct interior if you have an upholsterer."),
    ("Interior", "Gauge Cluster", "140 mph gauge cluster, 74k miles", 180,
     "All gauges work and the odometer rolls. Clear lens has light scratches."),
    ("Interior", "Door Panels", "Door panels, gray, pair", 150,
     "No cracks at the armrest. Speaker grilles are intact."),
    ("Interior", "Center Console", "Center console with armrest", 85,
     "Gray. Lid latch still works."),
    ("Interior", "Steering Wheel", "Leather GT steering wheel", 70,
     "Some shine from use. Horn pad is good."),
    ("Interior", "Dash Pad", "Dash pad, no cracks, a real unicorn", 300,
     "Stored out of the sun since 1998. I measured and I'm not joking: not one crack anywhere."),
    ("Interior", "Pillars", "A-pillar and sail panel trim set", 55,
     "Faded a little. Tabs are intact."),
    ("Interior", "Pedals", "Billet pedal covers", 30,
     "Pull straight off."),
    ("Interior", "Roll Bar", "4-point bolt-in roll bar for coupe", 310,
     "Black powder coat. All mounting plates and hardware are in the box."),
    ("Interior", "Knobs", "HVAC control knobs, set of 3", 15,
     "Original."),
    ("Wheels", "Pony Wheels", "Pony wheels, 15x7, set of 4", 280,
     "Refinished in silver about three years ago. Hold air. Tires are done, so factor those in."),
    ("Wheels", "Turbine Wheels", "Turbine wheels, 15 inch, set of 4", 340,
     "Good original finish with some curb rash on one. All center caps included."),
    ("Wheels", "Bullitts", "17 inch Bullitt wheels, set of 4", 720,
     "Staggered set, with lug nuts. No bends. Tires have about 60% tread left."),
    ("Wheels", "Cobra R Wheels", "Cobra R style 17x9, staggered, 5-lug, great for a track car or a nice street build, ready to mount", 810,
     "Set of 4. Light scratches. Balanced with no vibration when they came off."),
    ("Wheels", "Drag Packs", "Drag pack wheels and slicks", 625,
     "Front runners and rear skinnies. Only seen about ten passes."),
    ("Wheels", "Lug Nuts", "Gold-tone lug nut set", 20,
     "20 nuts and a key."),
    ("Wheels", "Center Caps", "Pony wheel center caps, set of 4", 50,
     "Decent finish, no broken tabs."),
    ("Wheels", "Spare", "Factory space-saver spare", 35,
     "Never on the ground. Rubber is old, so treat it as display only."),
    ("Other", "Shop Manuals", "Ford factory shop manual set, '79-'93", 60,
     "Greasy thumbprints on the engine chapter, otherwise complete."),
    ("Other", "Car Cover", "Fitted outdoor car cover for hatch", 45,
     "Used for two winters. Elastic is still good. No tears."),
]

# Each part's (category, fits), by image label. These are the values stored on
# Listing, so they must match Category and Fits in models.py.
LISTING_DETAILS = {
    "GT40 Heads": ("engine", "all"),
    "E303 Cam": ("engine", "all"),
    "65mm TB": ("engine", "all"),
    "24lb Injectors": ("engine", "all"),
    "Mass Air": ("engine", "aero"),
    "Headers": ("engine", "all"),
    "Intake": ("engine", "all"),
    "Radiator": ("engine", "all"),
    "Long Block": ("engine", "aero"),
    "Valve Covers": ("engine", "all"),
    "Oil Pan": ("engine", "all"),
    "Cobra Swap": ("drivetrain", "aero"),
    "T-5 Package": ("drivetrain", "all"),
    "T-5": ("drivetrain", "all"),
    "8.8 Rear": ("drivetrain", "all"),
    "Full Rear End": ("drivetrain", "all"),
    "Pro 5.0": ("drivetrain", "all"),
    "Driveshaft": ("drivetrain", "all"),
    "Clutch Cable": ("drivetrain", "all"),
    "Gears": ("drivetrain", "all"),
    "K-Member": ("suspension_brakes", "all"),
    "Connectors": ("suspension_brakes", "all"),
    "Bilsteins": ("suspension_brakes", "all"),
    "Coilovers": ("suspension_brakes", "all"),
    "Control Arms": ("suspension_brakes", "all"),
    "Sway Bar": ("suspension_brakes", "aero"),
    "Caster Plates": ("suspension_brakes", "all"),
    "Lowering Springs": ("suspension_brakes", "all"),
    "Bump Steer": ("suspension_brakes", "all"),
    "Rolling Shell": ("exterior", "aero"),
    "Bezels": ("exterior", "four_eye"),
    "Cobra R Hood": ("exterior", "aero"),
    "Ground Effects": ("exterior", "aero"),
    "Saleen Wing": ("exterior", "aero"),
    "LX Taillights": ("exterior", "aero"),
    "Hood": ("exterior", "four_eye"),
    "Trim Clip": ("interior", "all"),
    "Fender": ("exterior", "aero"),
    "Headlights": ("exterior", "aero"),
    "Door": ("exterior", "all"),
    "Louvers": ("exterior", "all"),
    "Antenna": ("exterior", "all"),
    "Recaro Seats": ("interior", "four_eye"),
    "Gauge Cluster": ("interior", "aero"),
    "Door Panels": ("interior", "aero"),
    "Center Console": ("interior", "aero"),
    "Steering Wheel": ("interior", "aero"),
    "Dash Pad": ("interior", "aero"),
    "Pillars": ("interior", "four_eye"),
    "Pedals": ("interior", "all"),
    "Roll Bar": ("interior", "all"),
    "Knobs": ("interior", "four_eye"),
    "Pony Wheels": ("wheels_tires", "aero"),
    "Turbine Wheels": ("wheels_tires", "aero"),
    "Bullitts": ("wheels_tires", "all"),
    "Cobra R Wheels": ("wheels_tires", "aero"),
    "Drag Packs": ("wheels_tires", "all"),
    "Lug Nuts": ("wheels_tires", "all"),
    "Center Caps": ("wheels_tires", "aero"),
    "Spare": ("wheels_tires", "four_eye"),
    "Shop Manuals": ("other", "all"),
    "Car Cover": ("other", "aero"),
}
