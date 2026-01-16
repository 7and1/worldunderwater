# Database Schema Documentation

## Overview

The worldunderwater.org database follows a **strict separation** between raw data ingestion and content production layers. This architecture ensures data integrity, traceability, and scalability.

## Architecture Principles

### 1. Physical Separation of Concerns

```
RAW DATA LAYER          CONTENT LAYER           COMMERCE LAYER
================        ==============          ===============
raw_events       --->   published_articles      products
ingestion_logs          article_products        product_disaster_matches
api_sources
                              |
                              v
                      disaster_types (Reference)
```

### 2. Immutability of Raw Data

The `raw_events` table stores complete API responses in `raw_payload` (JSONB). This data is **never modified** after insertion. Instead:

- Normalized fields are extracted for querying
- `payload_hash` enables change detection
- Processing state is tracked separately from source data

### 3. Traceability

Every published article links back to its source data:

- `primary_event_id` - Main source event
- `raw_event_ids[]` - All contributing events
- `source_attribution` - Human-readable credits

---

## Collections

### 1. DISASTER_TYPES (Reference Table)

Canonical list of disaster classifications used across the system.

| Field       | Type         | Description                                   |
| ----------- | ------------ | --------------------------------------------- |
| code        | VARCHAR(32)  | Unique identifier (e.g., 'flood', 'wildfire') |
| name        | VARCHAR(100) | Display name                                  |
| description | TEXT         | Detailed description                          |
| colorHex    | VARCHAR(7)   | UI color for visualization                    |
| isActive    | BOOLEAN      | Enable/disable for processing                 |

**Seeded Values:**

- flood, wildfire, earthquake, tsunami, hurricane
- tornado, drought, volcanic, landslide, storm
- heat_wave, cold_wave

---

### 2. RAW_EVENTS (Data Lake)

Immutable storage for events from external APIs.

| Field            | Type        | Description                                 |
| ---------------- | ----------- | ------------------------------------------- |
| id               | UUID        | Primary key                                 |
| source           | ENUM        | nasa_eonet, usgs_earthquake, reliefweb      |
| sourceId         | VARCHAR     | Original ID from API                        |
| rawPayload       | JSONB       | Complete API response (immutable)           |
| payloadHash      | VARCHAR(64) | SHA256 for deduplication                    |
| disasterTypeId   | FK          | Link to disaster_types                      |
| coordinates      | GEOGRAPHY   | PostGIS point                               |
| occurredAt       | TIMESTAMPTZ | When event happened                         |
| status           | ENUM        | new, processing, processed, archived, error |
| articleGenerated | BOOLEAN     | Content generation flag                     |

**Deduplication Strategy:**

```sql
-- Unique constraint on source + sourceId
CONSTRAINT uq_source_event UNIQUE (source, source_id)

-- Change detection via hash
SELECT * FROM check_event_changed('nasa_eonet', 'EONET_123', 'abc123hash');
```

**Key Indexes:**

- `(source, source_id)` UNIQUE - Prevent duplicates
- `(status) WHERE status = 'new'` - Processing queue
- `(coordinates) GIST` - Geospatial queries
- `(occurred_at DESC)` - Timeline queries

---

### 3. PUBLISHED_ARTICLES (Content Production)

AI-generated articles with full source traceability.

| Field           | Type         | Description                                   |
| --------------- | ------------ | --------------------------------------------- |
| id              | UUID         | Primary key                                   |
| title           | VARCHAR(500) | Article title                                 |
| slug            | VARCHAR(500) | URL path (unique)                             |
| content         | TEXT         | Rich text / HTML / MDX                        |
| disasterTypeId  | FK           | Link to disaster_types                        |
| primaryEventId  | FK           | Main source event                             |
| rawEventIds     | UUID[]       | All source events                             |
| aiModel         | VARCHAR      | e.g., 'gpt-4', 'claude-3'                     |
| aiPromptVersion | VARCHAR      | Prompt tracking                               |
| status          | ENUM         | draft, review, scheduled, published, archived |
| products        | ARRAY        | Recommended products with context             |

**Content Types:**

- `news` - Breaking event coverage
- `guide` - Preparedness guides
- `analysis` - In-depth analysis
- `alert` - Emergency alerts
- `update` - Event updates

---

### 4. PRODUCTS (Commerce)

Affiliate product catalog matched to disaster types.

| Field             | Type          | Description                        |
| ----------------- | ------------- | ---------------------------------- |
| id                | SERIAL        | Primary key                        |
| name              | VARCHAR(300)  | Product name                       |
| slug              | VARCHAR(300)  | URL path (unique)                  |
| affiliateUrl      | VARCHAR(2000) | Affiliate link                     |
| affiliateNetwork  | VARCHAR       | amazon, shareasale, etc.           |
| categories        | VARCHAR[]     | water, shelter, first-aid, etc.    |
| priority          | INTEGER       | 1-100, higher = more prominent     |
| matchingDisasters | ARRAY         | Disaster type mappings with scores |

**Product Categories:**

- water, food, shelter, first-aid
- communication, power, tools
- clothing, navigation, safety

---

### 5. INGESTION_LOGS (System)

Track all API ingestion operations.

| Field         | Type      | Description                                    |
| ------------- | --------- | ---------------------------------------------- |
| id            | BIGSERIAL | Primary key                                    |
| source        | ENUM      | Data source                                    |
| jobId         | UUID      | Group related operations                       |
| status        | ENUM      | started, success, partial, error, rate_limited |
| eventsFound   | INTEGER   | Total from API                                 |
| eventsNew     | INTEGER   | Actually inserted                              |
| eventsUpdated | INTEGER   | Updated existing                               |
| durationMs    | INTEGER   | Execution time                                 |

---

## Data Flow

### Ingestion Pipeline

```
1. Cron triggers ingestion for each source
2. Fetch from API (NASA EONET, USGS, ReliefWeb)
3. For each event:
   a. Compute payload_hash
   b. Check if exists with same hash (skip if unchanged)
   c. Insert/update raw_events
   d. Log to ingestion_logs
4. Mark new events for content generation
```

### Content Generation Pipeline

```
1. Query raw_events WHERE status = 'new'
2. Group related events by location/time
3. AI generates article from event data
4. Insert published_articles with:
   - Link to primary_event_id
   - All raw_event_ids for traceability
   - AI metadata for auditing
5. Auto-match products by disaster_type
6. Update raw_events.article_generated = true
```

### Product Matching

```sql
-- Get products for a disaster type, ordered by relevance
SELECT p.*, pdm.relevance_score, pdm.is_essential
FROM products p
JOIN product_disaster_matches pdm ON p.id = pdm.product_id
WHERE pdm.disaster_type_id = (SELECT id FROM disaster_types WHERE code = 'flood')
  AND p.status = 'active'
ORDER BY pdm.is_essential DESC, pdm.relevance_score DESC, p.priority DESC;
```

---

## PayloadCMS Integration

Collections are configured in `/src/collections/`:

- `DisasterTypes.ts` - Reference data with validation
- `RawEvents.ts` - Immutable event storage
- `Products.ts` - Commerce with disaster matching
- `PublishedArticles.ts` - Content with versioning
- `IngestionLogs.ts` - System monitoring

Key features:

- Field-level access control
- Auto-slug generation
- Conditional field visibility
- Draft versioning for articles

---

## Performance Considerations

### Indexes Summary

| Table              | Index                      | Purpose          |
| ------------------ | -------------------------- | ---------------- |
| raw_events         | (source, source_id) UNIQUE | Deduplication    |
| raw_events         | (status) WHERE new         | Processing queue |
| raw_events         | (coordinates) GIST         | Geo queries      |
| published_articles | (slug) UNIQUE              | URL routing      |
| published_articles | (status, published_at)     | Listings         |
| products           | (status, priority)         | Display order    |
| ingestion_logs     | (source, started_at)       | Monitoring       |

### Partitioning (Future)

For high-volume tables:

- `raw_events` - Partition by `occurred_at` (monthly)
- `ingestion_logs` - Partition by `started_at` (monthly)
- `analytics_events` - Use TimescaleDB hypertable

---

## Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@host:5432/worldunderwater
```

## Migration

```bash
# Generate migrations
pnpm payload migrate:create

# Run migrations
pnpm payload migrate
```
