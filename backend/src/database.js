import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export class AegisDatabase {
  constructor(filename) {
    if (filename !== ':memory:') fs.mkdirSync(path.dirname(filename), { recursive: true });
    this.sqlite = new DatabaseSync(filename);
    this.sqlite.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
    this.createSchema();
  }

  createSchema() {
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL COLLATE NOCASE UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('EMPLOYEE','TECHNICIAN','ADMINISTRATOR')),
        active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
        skills TEXT NOT NULL DEFAULT '[]',
        available INTEGER NOT NULL DEFAULT 1 CHECK(available IN (0,1)),
        capacity INTEGER NOT NULL DEFAULT 6 CHECK(capacity >= 0),
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS it_services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL COLLATE NOCASE UNIQUE,
        description TEXT NOT NULL DEFAULT '',
        business_criticality INTEGER NOT NULL CHECK(business_criticality BETWEEN 1 AND 3),
        active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL COLLATE NOCASE UNIQUE,
        keywords TEXT NOT NULL DEFAULT '[]',
        active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sla_policies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        priority TEXT NOT NULL UNIQUE CHECK(priority IN ('P1','P2','P3','P4')),
        response_minutes INTEGER NOT NULL CHECK(response_minutes > 0),
        resolution_minutes INTEGER NOT NULL CHECK(resolution_minutes > 0),
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS system_configuration (
        config_key TEXT PRIMARY KEY,
        config_value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_code TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        reporter_id INTEGER NOT NULL REFERENCES users(id),
        category_id INTEGER REFERENCES categories(id),
        service_id INTEGER NOT NULL REFERENCES it_services(id),
        impact INTEGER NOT NULL CHECK(impact BETWEEN 1 AND 3),
        urgency INTEGER NOT NULL CHECK(urgency BETWEEN 1 AND 3),
        business_criticality INTEGER NOT NULL CHECK(business_criticality BETWEEN 1 AND 3),
        affected_users INTEGER NOT NULL DEFAULT 1 CHECK(affected_users > 0),
        priority TEXT NOT NULL CHECK(priority IN ('P1','P2','P3','P4')),
        priority_score INTEGER NOT NULL,
        priority_explanation TEXT NOT NULL,
        status TEXT NOT NULL,
        assigned_technician_id INTEGER REFERENCES users(id),
        assignment_explanation TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        acknowledged_at TEXT,
        investigation_started_at TEXT,
        resolution_description TEXT,
        resolved_at TEXT,
        verification_note TEXT,
        verified_at TEXT,
        closed_at TEXT,
        response_minutes INTEGER NOT NULL,
        resolution_minutes INTEGER NOT NULL,
        response_deadline TEXT NOT NULL,
        resolution_deadline TEXT NOT NULL,
        response_warning_sent INTEGER NOT NULL DEFAULT 0,
        resolution_warning_sent INTEGER NOT NULL DEFAULT 0,
        response_breached INTEGER NOT NULL DEFAULT 0,
        resolution_breached INTEGER NOT NULL DEFAULT 0,
        escalation_level INTEGER NOT NULL DEFAULT 0,
        version INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS incident_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_id INTEGER NOT NULL REFERENCES incidents(id),
        technician_id INTEGER REFERENCES users(id),
        assigned_by INTEGER REFERENCES users(id),
        strategy TEXT NOT NULL,
        reason TEXT NOT NULL,
        assigned_at TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS investigation_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_id INTEGER NOT NULL REFERENCES incidents(id),
        author_id INTEGER NOT NULL REFERENCES users(id),
        note TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS incident_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_id INTEGER NOT NULL REFERENCES incidents(id),
        author_id INTEGER NOT NULL REFERENCES users(id),
        message TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'COMMENT',
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS incident_relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_id INTEGER NOT NULL REFERENCES incidents(id),
        related_incident_id INTEGER NOT NULL REFERENCES incidents(id),
        relation_type TEXT NOT NULL DEFAULT 'POTENTIAL_DUPLICATE',
        similarity_score INTEGER,
        created_at TEXT NOT NULL,
        UNIQUE(incident_id, related_incident_id),
        CHECK(incident_id <> related_incident_id)
      );
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_id INTEGER NOT NULL REFERENCES users(id),
        incident_id INTEGER REFERENCES incidents(id),
        type TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        read_at TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS simulated_emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_id INTEGER REFERENCES users(id),
        recipient_email TEXT NOT NULL,
        incident_id INTEGER REFERENCES incidents(id),
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        delivery_status TEXT NOT NULL DEFAULT 'SIMULATED_DELIVERED',
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS audit_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_id INTEGER REFERENCES incidents(id),
        actor_id INTEGER REFERENCES users(id),
        actor_role TEXT NOT NULL,
        action_type TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        description TEXT NOT NULL,
        metadata TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sla_breaches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_id INTEGER NOT NULL REFERENCES incidents(id),
        breach_type TEXT NOT NULL CHECK(breach_type IN ('RESPONSE','RESOLUTION')),
        detected_at TEXT NOT NULL,
        UNIQUE(incident_id, breach_type)
      );
      CREATE TABLE IF NOT EXISTS escalations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_id INTEGER NOT NULL REFERENCES incidents(id),
        escalation_level INTEGER NOT NULL,
        reason TEXT NOT NULL,
        destination TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(incident_id, escalation_level)
      );
      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_id INTEGER NOT NULL UNIQUE REFERENCES incidents(id),
        reporter_id INTEGER NOT NULL REFERENCES users(id),
        rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
        comment TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS service_dependencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id INTEGER NOT NULL REFERENCES it_services(id),
        depends_on_service_id INTEGER NOT NULL REFERENCES it_services(id),
        created_at TEXT NOT NULL,
        UNIQUE(service_id, depends_on_service_id),
        CHECK(service_id <> depends_on_service_id)
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
      CREATE INDEX IF NOT EXISTS idx_incidents_priority ON incidents(priority);
      CREATE INDEX IF NOT EXISTS idx_incidents_reporter ON incidents(reporter_id);
      CREATE INDEX IF NOT EXISTS idx_incidents_assignee ON incidents(assigned_technician_id);
      CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at);
      CREATE INDEX IF NOT EXISTS idx_audit_incident ON audit_events(incident_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, read_at, created_at);
    `);
  }

  run(sql, params = {}) { return this.sqlite.prepare(sql).run(params); }
  get(sql, params = {}) { return this.sqlite.prepare(sql).get(params); }
  all(sql, params = {}) { return this.sqlite.prepare(sql).all(params); }
  value(sql, params = {}) { const row = this.get(sql, params); return row ? Object.values(row)[0] : undefined; }

  transaction(callback) {
    this.sqlite.exec('BEGIN IMMEDIATE');
    try {
      const result = callback();
      this.sqlite.exec('COMMIT');
      return result;
    } catch (error) {
      this.sqlite.exec('ROLLBACK');
      throw error;
    }
  }

  close() { this.sqlite.close(); }
}

export class BaseRepository {
  constructor(database) { this.db = database; }
  insert(table, data) {
    const keys = Object.keys(data);
    const columns = keys.join(', ');
    const bindings = keys.map((key) => `:${key}`).join(', ');
    const result = this.db.run(`INSERT INTO ${table} (${columns}) VALUES (${bindings})`, data);
    return Number(result.lastInsertRowid);
  }
}

export class UserRepository extends BaseRepository {
  byId(id) { return this.db.get('SELECT * FROM users WHERE id = :id', { id }); }
  byEmail(email) { return this.db.get('SELECT * FROM users WHERE email = :email', { email }); }
  list() { return this.db.all('SELECT * FROM users ORDER BY role, name'); }
  technicians() {
    return this.db.all(`SELECT u.*, COUNT(CASE WHEN i.status NOT IN ('RESOLVED','VERIFIED','CLOSED') THEN 1 END) AS active_workload
      FROM users u LEFT JOIN incidents i ON i.assigned_technician_id = u.id
      WHERE u.role = 'TECHNICIAN' GROUP BY u.id ORDER BY u.name`);
  }
}

export class IncidentRepository extends BaseRepository {
  byId(id) { return this.db.get('SELECT * FROM incidents WHERE id = :id OR incident_code = :id', { id: String(id) }); }
  nextSequence() { return Number(this.db.value('SELECT COUNT(*) + 1 AS next FROM incidents') ?? 1); }
  activeWorkload(technicianId) { return Number(this.db.value(`SELECT COUNT(*) FROM incidents WHERE assigned_technician_id = :technicianId AND status NOT IN ('RESOLVED','VERIFIED','CLOSED')`, { technicianId }) ?? 0); }

  historicalFixes(incidentId, technicianId) {
    return this.db.all(`SELECT i.id, i.title, i.description, i.resolution_description, i.category_id, i.service_id,
        c.name AS category_name, s.name AS service_name
      FROM incidents i LEFT JOIN categories c ON c.id=i.category_id JOIN it_services s ON s.id=i.service_id
      WHERE i.status IN ('RESOLVED','VERIFIED','CLOSED') AND i.resolution_description IS NOT NULL
        AND i.id<>:incidentId AND (:technicianId IS NULL OR i.assigned_technician_id=:technicianId)
      ORDER BY i.resolved_at DESC, i.id DESC LIMIT 200`, { incidentId, technicianId });
  }

  activeForRescue() {
    return this.db.all(`SELECT i.id, i.incident_code, i.title, i.status, i.priority, i.assigned_technician_id,
        i.acknowledged_at, i.resolved_at, i.response_deadline, i.resolution_deadline,
        i.response_minutes, i.resolution_minutes, i.response_breached, i.resolution_breached, i.escalation_level,
        t.name AS technician_name, CASE WHEN t.role='TECHNICIAN' THEN t.active ELSE 0 END AS technician_active
      FROM incidents i LEFT JOIN users t ON t.id=i.assigned_technician_id
      WHERE i.status NOT IN ('RESOLVED','VERIFIED','CLOSED')`);
  }

  rescueReminders(incidentId = null) {
    return this.db.all(`SELECT a.incident_id, json_extract(a.metadata, '$.target') AS target,
        json_extract(a.metadata, '$.technicianId') AS technician_id
      FROM audit_events a JOIN incidents i ON i.id=a.incident_id
      WHERE a.action_type='SLA_RESCUE_REMINDER'
        AND i.status NOT IN ('RESOLVED','VERIFIED','CLOSED')
        AND i.assigned_technician_id=json_extract(a.metadata, '$.technicianId')
        AND (:incidentId IS NULL OR a.incident_id=:incidentId)`, { incidentId });
  }
}
