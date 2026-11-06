from django import forms
from django.db.models import F, Q
from django_filters import rest_framework as filters

from .models import CONDITION_CHOICES, US_STATES, Category, Fits, Listing


class IntegerFilter(filters.Filter):
    # Prices and user ids are whole numbers, so "abc" and "1.5" both get a 400.
    field_class = forms.IntegerField


# What each public ordering value sorts by. "listed" is an alias: URLs never
# name bumped_at, so that field can change without breaking saved searches.
# created_at is deliberately absent, because sorting by it would reveal
# owner-only dates. Each order ends in -id so ties can't shuffle between pages,
# and listings with no price sort last instead of looking cheapest or priciest.
LISTING_ORDERINGS = {
    "-listed": ("-bumped_at", "-id"),
    "listed": ("bumped_at", "-id"),
    "price": (F("price").asc(nulls_last=True), "-id"),
    "-price": (F("price").desc(nulls_last=True), "-id"),
}


class ListingFilter(filters.FilterSet):
    q = filters.CharFilter(method="filter_keyword")
    min_price = IntegerFilter(field_name="price", lookup_expr="gte")
    max_price = IntegerFilter(field_name="price", lookup_expr="lte")
    # distinct=False: these columns are on Listing, so no join can repeat a row.
    condition = filters.MultipleChoiceFilter(
        choices=CONDITION_CHOICES, distinct=False
    )
    category = filters.MultipleChoiceFilter(choices=Category.choices, distinct=False)
    fits = filters.ChoiceFilter(choices=Fits.choices, method="filter_fits")
    state = filters.ChoiceFilter(field_name="user__profile__state", choices=US_STATES)
    user = IntegerFilter(field_name="user_id")
    ordering = filters.ChoiceFilter(
        choices=[(value, value) for value in LISTING_ORDERINGS],
        method="filter_ordering",
    )

    class Meta:
        model = Listing
        fields = []

    def filter_keyword(self, queryset, name, value):
        # Every word has to appear, in either field and in any order.
        for word in value.split():
            queryset = queryset.filter(
                Q(title__icontains=word) | Q(description__icontains=word)
            )
        return queryset

    def filter_fits(self, queryset, name, value):
        # Someone with a four-eye car also wants parts that fit every Fox Body.
        # Not-set listings have a blank value, so they never match.
        if value == Fits.ALL:
            return queryset.filter(fits=Fits.ALL)
        return queryset.filter(fits__in=[value, Fits.ALL])

    def filter_ordering(self, queryset, name, value):
        return queryset.order_by(*LISTING_ORDERINGS[value])
