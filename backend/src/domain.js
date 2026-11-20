import crypto from 'node:crypto';

export const Roles = Object.freeze({
  EMPLOYEE: 'EMPLOYEE',
  TECHNICIAN: 'TECHNICIAN',
  ADMINISTRATOR: 'ADMINISTRATOR',
});

export const IncidentStatus = Object.freeze({
  NEW: 'NEW',
  CLASSIFIED: 'CLASSIFIED',
  ASSIGNED: 'ASSIGNED',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_FOR_INFORMATION: 'WAITING_FOR_INFORMATION',
  RESOLVED: 'RESOLVED',
  VERIFIED: 'VERIFIED',
  CLOSED: 'CLOSED',
});

export const Priorities = Object.freeze(['P1', 'P2', 'P3', 'P4']);

export class DomainError extends Error {
  constructor(message, status = 400, code = 'DOMAIN_ERROR', details = undefined) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends DomainError {
  constructor(message, details) { super(message, 400, 'VALIDATION_ERROR', details); }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Authentication is required') { super(message, 401, 'UNAUTHORIZED'); }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'You are not allowed to perform this operation') { super(message, 403, 'FORBIDDEN'); }
}

export class NotFoundError extends DomainError {
  constructor(resource = 'Resource') { super(`${resource} was not found`, 404, 'NOT_FOUND'); }
}

export class ConflictError extends DomainError {
  constructor(message) { super(message, 409, 'CONFLICT'); }
}

export class LifecycleError extends DomainError {
  constructor(from, to) { super(`Transition from ${from} to ${to} is not permitted`, 409, 'INVALID_LIFECYCLE_TRANSITION'); }
}

export const nowIso = (clock = () => new Date()) => clock().toISOString();
export const addMinutes = (iso, minutes) => new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
export const minutesBetween = (from, to) => Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60_000);
export const parseJson = (value, fallback = []) => {
  if (Array.isArray(value) || (value && typeof value === 'object')) return value;
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};
export const normaliseText = (value = '') => value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

/** Base class used by the concrete role classes below. */
export class User {
  constructor({ id, name, email, role, active = true }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.active = Boolean(active);
  }

  can(role) { return this.role === role; }
  toPublic() { return { id: this.id, name: this.name, email: this.email, role: this.role, active: this.active }; }
}

export class Employee extends User {
  constructor(props) { super({ ...props, role: Roles.EMPLOYEE }); }
}

export class Technician extends User {
  constructor(props) {
    super({ ...props, role: Roles.TECHNICIAN });
    this.skills = parseJson(props.skills, []);
    this.available = Boolean(props.available);
    this.capacity = Number(props.capacity ?? 6);
  }
}

export class Administrator extends User {
  constructor(props) { super({ ...props, role: Roles.ADMINISTRATOR }); }
}

export const toPublicUser = (row) => row ? {
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  active: Boolean(row.active),
  skills: parseJson(row.skills, []),
  available: Boolean(row.available),
  capacity: Number(row.capacity ?? 0),
  createdAt: row.created_at,
} : null;

/** Deterministic, explainable priority policy. */
export class PriorityCalculator {
  calculate({ impact, urgency, businessCriticality, affectedUsers = 1, serviceName = 'the affected service' }) {
    for (const [name, value] of Object.entries({ impact, urgency, businessCriticality })) {
      if (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 3) {
        throw new ValidationError(`${name} must be an integer from 1 to 3`);
      }
    }
    const numericImpact = Number(impact);
    const numericUrgency = Number(urgency);
    const numericCriticality = Number(businessCriticality);
    const numericAffected = Math.max(1, Number(affectedUsers) || 1);
    const baseScore = numericImpact * numericUrgency * numericCriticality;
    const userAdjustment = numericAffected >= 500 ? 5 : numericAffected >= 100 ? 3 : numericAffected >= 20 ? 1 : 0;
    const score = baseScore + userAdjustment;
    const priority = score >= 23 ? 'P1' : score >= 15 ? 'P2' : score >= 7 ? 'P3' : 'P4';
    const threshold = priority === 'P1' ? 'score >= 23' : priority === 'P2' ? '15-22' : priority === 'P3' ? '7-14' : 'score <= 6';
    const reasons = [
      `impact ${numericImpact}/3`,
      `urgency ${numericUrgency}/3`,
      `business criticality ${numericCriticality}/3 for ${serviceName}`,
    ];
    if (userAdjustment) reasons.push(`${numericAffected} affected users added ${userAdjustment} point${userAdjustment === 1 ? '' : 's'}`);
    return {
      priority,
      score,
      baseScore,
      userAdjustment,
      threshold,
      inputs: { impact: numericImpact, urgency: numericUrgency, businessCriticality: numericCriticality, affectedUsers: numericAffected, serviceName },
      explanation: `Priority ${priority} was assigned with a score of ${score} (${reasons.join(', ')}). The ${priority} threshold is ${threshold}.`,
      reasons,
    };
  }
}

/** Genuine Strategy pattern contract and interchangeable policies. */
export class TechnicianAssignmentStrategy {
  get key() { throw new Error('Subclasses must expose a strategy key'); }
  assign() { throw new Error('Subclasses must implement assign'); }
  eligible(technicians) {
    return technicians.filter((tech) => Boolean(tech.active) && Boolean(tech.available) && Number(tech.active_workload ?? 0) < Number(tech.capacity ?? 0));
  }
}

const skillsFor = (technician) => parseJson(technician.skills, []).map((skill) => normaliseText(skill));

export class SkillBasedAssignmentStrategy extends TechnicianAssignmentStrategy {
  get key() { return 'SKILL_BASED'; }

  assign({ technicians, categoryName, serviceName }) {
    const eligible = this.eligible(technicians);
    if (!eligible.length) return { technician: null, explanation: 'No available technician has remaining workload capacity.' };
    const categoryTokens = new Set(normaliseText(categoryName).split(' ').filter(Boolean));
    const serviceTokens = new Set(normaliseText(serviceName).split(' ').filter(Boolean));
    const ranked = eligible.map((tech) => {
      const skills = skillsFor(tech);
      const skillMatches = skills.filter((skill) => categoryTokens.has(skill) || serviceTokens.has(skill) || [...categoryTokens].some((token) => skill.includes(token))).length;
      const workload = Number(tech.active_workload ?? 0);
      const capacity = Number(tech.capacity ?? 1);
      const score = skillMatches * 100 + (capacity - workload) * 4 - workload;
      return { tech, skillMatches, workload, capacity, score };
    }).sort((a, b) => b.score - a.score || a.workload - b.workload || a.tech.name.localeCompare(b.tech.name));
    const winner = ranked[0];
    const matchingSkills = skillsFor(winner.tech).filter((skill) => categoryTokens.has(skill) || serviceTokens.has(skill) || [...categoryTokens].some((token) => skill.includes(token)));
    return {
      technician: winner.tech,
      explanation: `Assigned to ${winner.tech.name} using the skill-based strategy because ${matchingSkills.length ? `${matchingSkills.join(', ')} matches ${categoryName}` : 'they are the best available capacity match'}, and they have ${winner.workload} of ${winner.capacity} active slots occupied.`,
      score: winner.score,
    };
  }
}

export class LeastLoadedAssignmentStrategy extends TechnicianAssignmentStrategy {
  get key() { return 'LEAST_LOADED'; }

  assign({ technicians }) {
    const eligible = this.eligible(technicians).sort((a, b) => Number(a.active_workload ?? 0) - Number(b.active_workload ?? 0) || a.name.localeCompare(b.name));
    if (!eligible.length) return { technician: null, explanation: 'No available technician has remaining workload capacity.' };
    const winner = eligible[0];
    return {
      technician: winner,
      explanation: `Assigned to ${winner.name} using the least-loaded strategy: ${winner.active_workload} of ${winner.capacity} active incident slots are occupied.`,
      score: Number(winner.active_workload ?? 0),
    };
  }
}

export class AssignmentStrategyFactory {
  static create(key) {
    if (key === 'LEAST_LOADED') return new LeastLoadedAssignmentStrategy();
    return new SkillBasedAssignmentStrategy();
  }
}

export class IncidentLifecycle {
  static transitions = Object.freeze({
    [IncidentStatus.NEW]: [IncidentStatus.CLASSIFIED],
    [IncidentStatus.CLASSIFIED]: [IncidentStatus.ASSIGNED],
    [IncidentStatus.ASSIGNED]: [IncidentStatus.ACKNOWLEDGED],
    [IncidentStatus.ACKNOWLEDGED]: [IncidentStatus.IN_PROGRESS, IncidentStatus.WAITING_FOR_INFORMATION],
    [IncidentStatus.IN_PROGRESS]: [IncidentStatus.WAITING_FOR_INFORMATION, IncidentStatus.RESOLVED],
    [IncidentStatus.WAITING_FOR_INFORMATION]: [IncidentStatus.IN_PROGRESS],
    [IncidentStatus.RESOLVED]: [IncidentStatus.VERIFIED, IncidentStatus.IN_PROGRESS],
    [IncidentStatus.VERIFIED]: [IncidentStatus.CLOSED],
    [IncidentStatus.CLOSED]: [],
  });

  static assertTransition(from, to) {
    if (!this.transitions[from]?.includes(to)) throw new LifecycleError(from, to);
  }
}

// Treat the common Wi-Fi spelling as the configured "wifi" keyword.
const normalizeCategoryText = (value) => normaliseText(value).replace(/\bwi fi\b/g, 'wifi');

export class CategorySuggester {
  suggest(text, categories) {
    const normalized = ` ${normalizeCategoryText(text)} `;
    const matches = categories.map((category) => {
      const keywords = [...new Set(parseJson(category.keywords, []).map(normalizeCategoryText).filter(Boolean))];
      const matched = keywords.filter((keyword) => normalized.includes(` ${keyword} `));
      return { category, matched, score: matched.length / Math.max(keywords.length, 1) };
    }).filter((entry) => entry.matched.length).sort((a, b) => b.score - a.score || b.matched.length - a.matched.length || a.category.name.localeCompare(b.category.name));
    if (!matches.length) return { category: null, confidence: 0, explanation: 'No category keyword matched; choose a category manually.' };
    const top = matches[0];
    return {
      category: top.category,
      confidence: Math.round(top.score * 100),
      matchedKeywords: top.matched,
      explanation: `Suggested ${top.category.name} because the description contains: ${top.matched.join(', ')}. This is a rule-based match, not an ML probability.`,
    };
  }
}

const STOP_WORDS = new Set(['a', 'an', 'the', 'is', 'are', 'to', 'of', 'and', 'or', 'in', 'on', 'for', 'with', 'my', 'our', 'please', 'cannot', 'cant', 'not', 'from', 'this', 'that', 'it', 'be']);
const tokenSet = (text) => new Set(normaliseText(text).split(' ').filter((token) => token.length > 2 && !STOP_WORDS.has(token)));

export class DuplicateDetector {
  compare(candidate, existing) {
    const a = tokenSet(`${candidate.title ?? ''} ${candidate.description ?? ''}`);
    const b = tokenSet(`${existing.title ?? ''} ${existing.description ?? ''}`);
    const intersection = [...a].filter((token) => b.has(token));
    const union = new Set([...a, ...b]);
    const textual = union.size ? intersection.length / union.size : 0;
    const serviceBonus = candidate.serviceId && Number(candidate.serviceId) === Number(existing.service_id ?? existing.serviceId) ? 0.25 : 0;
    const categoryBonus = candidate.categoryId && Number(candidate.categoryId) === Number(existing.category_id ?? existing.categoryId) ? 0.15 : 0;
    const score = Math.min(1, textual + serviceBonus + categoryBonus);
    return {
      score: Math.round(score * 100),
      textualScore: Math.round(textual * 100),
      sharedKeywords: intersection,
      serviceMatch: Boolean(serviceBonus),
      categoryMatch: Boolean(categoryBonus),
      explanation: `Weighted Jaccard text similarity is ${Math.round(textual * 100)}%${serviceBonus ? '; same service adds 25 points' : ''}${categoryBonus ? '; same category adds 15 points' : ''}.`,
    };
  }
}

const FIX_STOP_WORDS = new Set([...STOP_WORDS, 'after', 'before', 'error', 'errors', 'issue', 'issues', 'problem',
  'problems', 'help', 'need', 'still', 'work', 'working', 'user', 'users', 'student', 'students', 'staff',
  'again', 'since', 'when', 'while', 'has', 'have', 'was', 'were', 'today', 'redacted']);
const FIX_SYMPTOMS = new Set(['wifi', 'dns', 'vpn', 'dhcp', 'login', 'mfa', 'sso', 'latency', 'timeout', 'crash',
  'backup', 'payment', 'outage', 'disconnect']);

function safeKnowledgeText(value = '') {
  return (value ?? '')
    .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/gi, '[redacted]')
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, '[redacted]')
    .replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, '[redacted]')
    .replace(/\bBearer\s+\S+/gi, '[redacted]')
    .replace(/\b(?:password|passphrase|passcode|pin|otp|mfa code|verification code|recovery code|secret|(?:api|private) key|(?:access |session |refresh )?token)\s*(?:[:=]|\bis\b|\bto\b)\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, '[redacted]')
    .replace(/\b[a-f0-9]{24,}\b/gi, '[redacted]')
    .replace(/\s+/g, ' ').trim();
}

function fixWords(text) {
  return normaliseText(safeKnowledgeText(text).normalize('NFKD').replace(/\p{M}/gu, ''))
    .replace(/\b(?:wi fi|wireless)\b/g, 'wifi')
    .replace(/\b(?:sign in|log in|signin|logins)\b/g, 'login')
    .replace(/\b(?:multi factor authentication|two factor authentication|2fa)\b/g, 'mfa')
    .replace(/\b(?:disconnects|disconnected|disconnecting|disconnections?)\b/g, 'disconnect')
    .replace(/\b(?:timed out|time outs|timeouts?)\b/g, 'timeout')
    .replace(/\b(?:crashed|crashes|crashing)\b/g, 'crash')
    .split(' ').filter((word) => word.length > 2 && !FIX_STOP_WORDS.has(word) && /[a-z]/.test(word));
}

function fixTerms(incident) {
  const title = fixWords(incident.title);
  const description = fixWords(incident.description);
  const phrases = [title, description].flatMap((words) => words.slice(1).map((word, i) => `${words[i]} ${word}`));
  return { title: new Set(title), symptoms: new Set([...title, ...description]), phrases: new Set(phrases) };
}

function jaccard(a, b, intersection) {
  return intersection / Math.max(1, a.size + b.size - intersection);
}

/** Ranks permitted historical resolutions by lexical evidence and incident context. */
export class HistoricalFixMatcher {
  rank(current, candidates) {
    const source = fixTerms(current);
    const matches = [];
    for (const candidate of candidates) {
      const resolution = safeKnowledgeText(candidate.resolution_description);
      const resolutionWords = new Set(fixWords(resolution));
      if (resolutionWords.size < 3 || /^(?:n\/?a|none|unknown|resolved|fixed|done|no (?:fix|resolution)(?: (?:details|available|recorded))?|not applicable)[.! ]*$/i.test(resolution)) continue;
      const past = fixTerms(candidate);
      const shared = [...source.symptoms].filter((word) => past.symptoms.has(word));
      const phrases = [...source.phrases].filter((phrase) => past.phrases.has(phrase));
      if (shared.length < 2 && !shared.some((word) => FIX_SYMPTOMS.has(word))) continue;
      const titles = [...source.title].filter((word) => past.title.has(word));
      const fixOverlap = [...source.symptoms].filter((word) => resolutionWords.has(word)).length;
      const serviceMatch = current.service_id != null && current.service_id === candidate.service_id;
      const categoryMatch = current.category_id != null && current.category_id === candidate.category_id;
      const score = Math.round(45 * jaccard(source.symptoms, past.symptoms, shared.length)
        + 15 * jaccard(source.title, past.title, titles.length)
        + 15 * jaccard(source.phrases, past.phrases, phrases.length)
        + 10 * fixOverlap / Math.max(1, source.symptoms.size)
        + (serviceMatch ? 10 : 0) + (categoryMatch ? 5 : 0));
      if (score < 26) continue;
      const reasons = [`Shared symptoms include ${shared.slice(0, 5).join(', ')}.`];
      if (phrases.length) reasons.push(`Matching phrases include ${phrases.slice(0, 3).join(', ')}.`);
      if (serviceMatch) reasons.push('Same affected IT service.');
      if (categoryMatch) reasons.push('Same incident category.');
      if (fixOverlap) reasons.push('The previous resolution mentions current symptoms.');
      matches.push({
        incident: { id: candidate.id, title: safeKnowledgeText(candidate.title), service: candidate.service_name, category: candidate.category_name },
        resolution: resolution.length > 360 ? `${resolution.slice(0, 357).trimEnd()}…` : resolution,
        score, explanation: reasons.join(' '),
      });
    }
    // The repository supplies newest resolutions first, so stable sorting preserves that tie-break.
    return matches.sort((a, b) => b.score - a.score).slice(0, 4);
  }

  guidance(incident) {
    const category = normaliseText(incident.category_name ?? '');
    const symptoms = new Set(fixWords(`${incident.title ?? ''} ${incident.description ?? ''}`));
    const topic = ['network', 'authentication'].includes(category) ? category
      : ['wifi', 'dns', 'vpn'].some((word) => symptoms.has(word)) ? 'network'
      : ['login', 'mfa', 'sso'].some((word) => symptoms.has(word)) ? 'authentication' : 'service';
    if (topic === 'network') {
      return { title: 'Network troubleshooting', steps: [
        'Check whether multiple users or locations are affected.',
        'Check connectivity and network sign-in status on an affected device.',
        'Check the service status for a wider outage.',
      ] };
    }
    if (topic === 'authentication') {
      return { title: 'Sign-in troubleshooting', steps: [
        'Confirm the user is signing in with the expected campus account.',
        'Check authentication service availability and note the exact error.',
        'Follow the approved password-reset process if account recovery is needed.',
      ] };
    }
    return { title: 'Service troubleshooting', steps: [
      'Check whether the affected service is available.',
      'Record the exact error message and when it occurred.',
      'Confirm whether the issue affects more than one user or device.',
    ] };
  }
}

export class SlaRiskPredictor {
  target(incident, kind, now) {
    const deadline = incident[`${kind}_deadline`];
    const completedAt = kind === 'response' ? incident.acknowledged_at : incident.resolved_at;
    const end = Date.parse(deadline);
    const remaining = end - now.getTime();
    const recorded = Boolean(incident[`${kind}_breached`]);
    const overdue = (completedAt ? Date.parse(completedAt) > end : remaining < 0);
    const warningWindow = Number(incident[`${kind}_minutes`]) * 60_000 * 0.2;
    const approaching = !completedAt && remaining >= 0 && remaining <= warningWindow;
    return { kind, deadline, completedAt, remaining, overdue, recorded, approaching };
  }

  rescue(incident, now) {
    const targets = ['response', 'resolution'].map((kind) => this.target(incident, kind, now));
    const pending = targets.filter((target) => !target.completedAt)
      .sort((a, b) => a.remaining - b.remaining);
    const deadline = pending[0] ?? targets[1];
    const recorded = targets.some((target) => target.recorded || (target.completedAt && target.overdue));
    const needsAssignment = !incident.assigned_technician_id || incident.technician_active === 0;
    const risk = pending.some((target) => target.overdue) ? 'OVERDUE'
      : recorded ? 'BREACHED'
      : incident.priority === 'P1' ? 'CRITICAL'
      : pending.some((target) => target.approaching) ? 'APPROACHING'
      : needsAssignment ? 'UNASSIGNED' : 'ON_TRACK';
    const reasons = [];
    for (const target of targets) {
      const label = target.kind === 'response' ? 'Response' : 'Resolution';
      if (target.completedAt && target.overdue) {
        reasons.push(target.kind === 'response' ? 'Acknowledgement occurred after the response deadline.' : 'Resolution occurred after its deadline.');
      } else if (!target.completedAt && target.overdue) {
        reasons.push(`${label} deadline has passed${target.recorded ? ' and a breach is recorded' : ''}.`);
      } else if (target.approaching) {
        reasons.push(target.remaining === 0 ? `${label} is due now.` : `${label} is in the final 20% of its SLA window.`);
      } else if (target.recorded) {
        reasons.push(`A ${target.kind} breach was previously recorded.`);
      }
    }
    if (!incident.acknowledged_at) reasons.push('Technician acknowledgement is pending.');
    if (!incident.assigned_technician_id) reasons.push('No technician is assigned.');
    else if (needsAssignment) reasons.push('The assigned technician account is inactive.');
    if (risk === 'CRITICAL') reasons.push('P1 incidents require immediate review.');
    if (risk === 'ON_TRACK') reasons.unshift('The next deadline is within its SLA window.');
    return { risk, deadline, reason: reasons.join(' ') };
  }

  assess(incident, now = new Date()) {
    if (incident.response_breached || incident.resolution_breached) return { level: 'BREACHED', explanation: 'An SLA breach has already been recorded for this incident.' };
    if (incident.resolved_at) return { level: 'LOW', explanation: 'The incident was resolved without a recorded SLA breach.' };
    const { remaining, overdue } = this.target(incident, 'resolution', now);
    const total = Math.max(1, Number(incident.resolution_minutes) * 60_000);
    const ratio = remaining / total;
    let level = 'LOW';
    const reasons = [];
    if (overdue) return { level: 'BREACHED', explanation: 'The resolution deadline has passed. The monitor will record the breach.' };
    if (ratio <= 0.2 || (incident.priority === 'P1' && incident.status !== IncidentStatus.RESOLVED)) { level = 'HIGH'; reasons.push('little time remains for the resolution target'); }
    else if (ratio <= 0.45 || incident.status === IncidentStatus.WAITING_FOR_INFORMATION) { level = 'MODERATE'; reasons.push('the incident is partway through its resolution window'); }
    else reasons.push('sufficient resolution time remains');
    if (!incident.acknowledged_at) reasons.push('it has not yet been acknowledged');
    if (!incident.assigned_technician_id) { level = 'HIGH'; reasons.push('no technician is assigned'); }
    const minutes = Math.max(0, Math.ceil(remaining / 60_000));
    return { level, remainingMinutes: minutes, explanation: `${level} SLA risk: ${reasons.join(', ')} (${minutes} minute${minutes === 1 ? '' : 's'} remaining).` };
  }
}

export class IncidentFactory {
  constructor(priorityCalculator, clock = () => new Date()) { this.priorityCalculator = priorityCalculator; this.clock = clock; }
  create(input, service, sequence) {
    const createdAt = nowIso(this.clock);
    const priorityResult = this.priorityCalculator.calculate({ ...input, businessCriticality: service.business_criticality, serviceName: service.name });
    const datePart = createdAt.slice(0, 10).replaceAll('-', '');
    return {
      incidentCode: `INC-${datePart}-${String(sequence).padStart(4, '0')}`,
      createdAt,
      priorityResult,
      title: String(input.title).trim(),
      description: String(input.description).trim(),
    };
  }
}

/** Base notification abstraction used by persistent channel implementations. */
export class Notification {
  constructor({ recipientId, incidentId, type, subject, message, createdAt }) {
    Object.assign(this, { recipientId, incidentId, type, subject, message, createdAt });
  }
}

export class InAppNotification extends Notification {}
export class SimulatedEmailNotification extends Notification {}

export const createToken = () => crypto.randomBytes(32).toString('hex');
export const hashPassword = (password) => {
  if (typeof password !== 'string' || password.length < 8) throw new ValidationError('Password must have at least 8 characters');
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
};
export const verifyPassword = (password, stored) => {
  const [salt, expected] = String(stored).split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  return actual.length === expected.length && crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
};

export const assertRole = (actor, ...roles) => {
  if (!actor || !roles.includes(actor.role)) throw new ForbiddenError();
};
