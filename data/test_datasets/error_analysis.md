## Queries with No Results

- Query: 'What's a free outdoor event this Saturday that's baby-friendly?'
  Filters: {'baby_friendly': True, 'price': 'free'}

- Query: 'Free events this weekend'
  Filters: {'price': 'free'}

- Query: 'Budget-friendly activities'
  Filters: {'price': 'free'}


## Filter Usage Patterns

- []: 18 queries

- [('baby_friendly', True)]: 4 queries

- [('price', 'free')]: 2 queries

- [('baby_friendly', True), ('price', 'free')]: 1 queries


## Success Metrics

- Total queries: 25
- Successful (≥3 events): 22 (88.0%)
- Average events per query: 8.8