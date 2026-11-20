# UML class diagram

```mermaid
classDiagram
  class AegisDatabase {
    +run(sql, params)
    +get(sql, params)
    +all(sql, params)
    +transaction(callback)
  }
  class BaseRepository {
    +insert(table, data)
  }
  class UserRepository {
    +byEmail(email)
    +technicians()
  }
  class IncidentRepository {
    +byId(id)
    +nextSequence()
    +activeWorkload(technicianId)
  }
  class IncidentService {
    +create(actor, input)
    +recordTransition(incident, actor, target, action, description, fields)
    +assign(actor, id, input)
    +monitorSla()
  }
  class AuthService {
    +createUser(input, actor)
    +login(email, password)
    +actorForToken(token)
  }
  class IncidentLifecycle {
    +assertTransition(from, to)$
  }
  class IncidentFactory {
    +create(input, service, sequence)
  }
  class PriorityCalculator {
    +calculate(input)
  }
  class TechnicianAssignmentStrategy {
    +key
    +eligible(technicians)
    +assign(input)*
  }
  class SkillBasedAssignmentStrategy
  class LeastLoadedAssignmentStrategy
  class AssignmentStrategyFactory {
    +create(key)$
  }
  class EventPublisher {
    +subscribe(channel)
    +publish(event)
  }
  class RepositoryNotificationChannel
  class InAppNotificationChannel {
    +handle(event)
  }
  class SimulatedEmailNotificationChannel {
    +handle(event)
  }
  class AuditService {
    +record(event)
  }
  class DomainError
  class LifecycleError
  class ValidationError
  BaseRepository <|-- UserRepository
  BaseRepository <|-- IncidentRepository
  BaseRepository --> AegisDatabase
  AuthService o-- UserRepository
  IncidentService o-- IncidentRepository
  IncidentService *-- IncidentFactory
  IncidentService --> IncidentLifecycle
  IncidentService --> AssignmentStrategyFactory
  IncidentService o-- EventPublisher
  IncidentService o-- AuditService
  IncidentFactory --> PriorityCalculator
  AssignmentStrategyFactory ..> TechnicianAssignmentStrategy
  TechnicianAssignmentStrategy <|-- SkillBasedAssignmentStrategy
  TechnicianAssignmentStrategy <|-- LeastLoadedAssignmentStrategy
  EventPublisher o-- RepositoryNotificationChannel
  RepositoryNotificationChannel <|-- InAppNotificationChannel
  RepositoryNotificationChannel <|-- SimulatedEmailNotificationChannel
  DomainError <|-- LifecycleError
  DomainError <|-- ValidationError
```

Runtime classes are in `backend/src/domain.js`, `backend/src/services.js`, and `backend/src/database.js`. Incident DTOs and table associations are mapped in the [ER diagram](ER_DIAGRAM.md).
