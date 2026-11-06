from rest_framework.pagination import PageNumberPagination


class ListingPagination(PageNumberPagination):
    # 24 divides evenly into 2, 3 and 4 columns, so the last row of a full page
    # is never left partly empty.
    page_size = 24
    page_size_query_param = "page_size"
    # So no one can ask for every listing in one request.
    max_page_size = 100
