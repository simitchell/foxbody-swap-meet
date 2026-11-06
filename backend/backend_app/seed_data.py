"""Hand-written data for the seed_dev_data command. Local dev only."""

# Every seeded account uses this domain, which is how --flush finds them. It's
# under example.com, which is reserved, so no mail can reach a real person. It
# can't match plain @example.com test accounts like alice and bob.
SEED_EMAIL_DOMAIN = "seed.example.com"

# All seeded users share this password, so any of them can log in.
SEED_PASSWORD = "foxbody-dev-123"

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
