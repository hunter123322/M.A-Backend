**Data flow of comment count**

Post created
     ↓
User adds comment
     ↓
Update post.commentCount in cache
     ↓
After interval → Sync cached commentCount → MongoDB

---

**Post filtering**
I decided not to use AI for post filtering due to limited resources and complexity, so I built a simple custom AI like system that scores words in captions to categorize posts efficiently and each keyword gets a score (e.g., “happy” = 1, “music” = 1), averages are computed, and the highest-scoring words become tags.

**Pros**: Lightweight, fast, offline, easy to customize.
**Cons**: Limited accuracy, lacks deep understanding, requires manual tuning.