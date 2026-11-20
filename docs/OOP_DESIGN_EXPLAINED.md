# Object-oriented design

## Encapsulation and abstraction

`IncidentService` in `backend/src/services.js` owns mutations. Its `recordTransition` method calls `IncidentLifecycle.assertTransition`, updates status/version and appends an audit event. HTTP clients receive DTOs and request specific actions. `AuthService` keeps hashes and session rows behind `createUser`, `login`, `actorForToken` and `logout`.

The JavaScript strategy base class in `backend/src/domain.js` defines a shared contract. JavaScript checks that contract at runtime. The concrete classes share `eligible(technicians)`, which excludes inactive, unavailable and full technicians.

## Strategy, inheritance and polymorphism

The non-HTTP incident creation code uses this actual statement:

```js
const assignment = AssignmentStrategyFactory.create(strategyKey).assign({ technicians, categoryName: category.name, serviceName: service.name });
```

`SkillBasedAssignmentStrategy` and `LeastLoadedAssignmentStrategy` extend `TechnicianAssignmentStrategy`. The first scores skill matches, headroom and active workload. If no skills match, it uses the best available capacity match and explains that fallback. The second sorts by active assignment count and then name. Changing the persisted strategy changes which `assign` method runs. Add a strategy by implementing `key` and `assign`, registering the key in the factory and admin allowlist, and adding decision tests.

`ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError` and `LifecycleError` extend `DomainError`. The HTTP controller reads their status, code and message. This is another concrete inheritance relationship used by the application.

## Observer and notification channels

The publisher in `backend/src/services.js` invokes subscribers through a single behavioral contract:

```js
subscribe(channel) { this.channels.push(channel); }
publish(event) { this.channels.forEach((channel) => channel.handle(event)); }
```

`InAppNotificationChannel` and `SimulatedEmailNotificationChannel` extend `RepositoryNotificationChannel` and implement `handle(event)`. To add a channel, provide a handler and register it with the publisher. The service calls `AuditService.record` explicitly so each mutation can record its actor, prior value and next value.

## Factory, repository and composition

`IncidentFactory.create` combines a clock, a public sequence code, normalized input and the result of `PriorityCalculator.calculate`. `IncidentService.create` adds the SLA snapshot, assignment and audit records. `UserRepository` and `IncidentRepository` extend `BaseRepository` for shared inserts and encapsulate repeated queries. Some workflow-specific queries live next to their use cases in the services.

Services compose collaborators through constructor parameters. The incident relates to its reporter, technician, service and category through foreign keys. Its audit timeline, assignment history, SLA deadlines and feedback have distinct lifecycles and explicit links. Arrays store timelines and strategy candidates, sets normalize text tokens and deduplicate event recipients, and maps support grouped reports.
