# Entity relationship diagram

```mermaid
erDiagram
  USERS ||--o{ SESSIONS : authenticates
  USERS ||--o{ INCIDENTS : reports
  USERS ||--o{ INCIDENTS : assigned_to
  CATEGORIES ||--o{ INCIDENTS : classifies
  IT_SERVICES ||--o{ INCIDENTS : affects
  INCIDENTS ||--o{ INCIDENT_ASSIGNMENTS : history
  INCIDENTS ||--o{ INVESTIGATION_NOTES : contains
  INCIDENTS ||--o{ INCIDENT_COMMENTS : contains
  INCIDENTS ||--o{ AUDIT_EVENTS : records
  INCIDENTS ||--o{ NOTIFICATIONS : relates
  INCIDENTS ||--o{ SIMULATED_EMAILS : relates
  INCIDENTS ||--o{ SLA_BREACHES : has
  INCIDENTS ||--o{ ESCALATIONS : has
  INCIDENTS ||--o| FEEDBACK : receives
  INCIDENTS ||--o{ INCIDENT_RELATIONSHIPS : source
  INCIDENTS ||--o{ INCIDENT_RELATIONSHIPS : related
  IT_SERVICES ||--o{ SERVICE_DEPENDENCIES : parent
  IT_SERVICES ||--o{ SERVICE_DEPENDENCIES : child

  USERS {
    integer id PK
    text email UK
    text password_hash
    text role
    integer active
    text skills
    integer capacity
    integer available
  }
  INCIDENTS {
    integer id PK
    text incident_code UK
    integer reporter_id FK
    integer assigned_technician_id FK
    integer category_id FK
    integer service_id FK
    text status
    text priority
    text created_at
    text response_deadline
    text resolution_deadline
  }
  SLA_POLICIES {
    integer id PK
    text priority UK
    integer response_minutes
    integer resolution_minutes
  }
```

The creation service copies the selected SLA policy's targets into the incident row. There is no foreign key to the policy, so a policy edit preserves prior snapshots.
