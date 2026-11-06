www.foxbodyswapmeet.com

- A curated site for buying/selling parts for 79-93 Mustangs. "foxbodyswapmeet.com" or the like.

Dev Notes

One database with two tables. A one to many relationship.

Table 1 - Users

- First
- Last
- username/shopname
- password
- ['username', 'name', 'password', 'address', 'Primary Key'] - Can utilize Django's built in AUTH_USER?

Table 2 - Items

- Items for sale ['img', 'title', 'keywords', 'description', 'condition', 'price']

Users can

- register an account.
- log into their home page. Here they can view parts for sale displayed on cards (flex!) and search for items by keywords.
- use their "my booth" page
  - List a new item for sale
  - Manage listings, edit pricing, etc.
  - Log a dispute
  - Make purchases (cart?) and do transactions (shipping?).
- [SECONDARY]
  - leave feedback on their experiences with sellers.
  - upload tracking information
- [TERCIARY]
  - leave a seller rating after transactions

Admin can

- do all of this and also see another page of admin stuff.
- View Recent Sales
- Manage Dispute Tickets
- Review a listing and decide to kill it, give a reason
- View All Users

Routes

- index/home
- register new account
- sign in
- item detail
- payment method
- list new item
- submit a dispute ticket
- How it works
- About us
- Contact us?
- admin specific routes
  - view recent sales
  - manage users
  - manage tickets
  - review a listing and decide to kill it
  - browse all listings

[WHY?]

- Because eBay is not a specialty site. Car guys (hobbyists of all kinds really) want to hang out and do business with others who share their enthusiasm. Connections are just waiting to be made!

- The shared enthusiasm ("for enthusiasts, by enthusiasts") ensures knowledgability of subject matter, proper packing methods, values of rare and obscure items. - Because Facebook Marketplace is the wild west. "Is this available?"... UGH. FB Marketplace is fine if you can drive to the person and observe the item in person. But falls apart if shipping is involved. Nobody will come to your aid if you get wronged on Marketplace.
- Because Forums were good years ago, but still didn't offer much in terms of buyer protection except the risk of ruining one's reputation within the forum.


## Seeding local data

Fill your **local** database with believable users, listings, and cart items. From `backend/`:

```bash
venv/bin/python manage.py seed_dev_data              # create seed data
venv/bin/python manage.py seed_dev_data --flush      # delete seeded data, then re-seed
venv/bin/python manage.py seed_dev_data --flush-only # delete seeded data and stop
```

Log in as `seed_demo`, or any seeded user, with the password `foxbody-dev-123`.

**Local only.** The command refuses to run unless the database is `foxbody_local` on a local host with `DEBUG` on, and there is no override. Never run it against production. See `CLAUDE.md` for all the options.
