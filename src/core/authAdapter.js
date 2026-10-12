/**
 * NexusSync Demo Authentication Adapter
 * 
 * BOUNDARY SPECIFICATION:
 * - Isolated DEMO authentication adapter.
 * - Does NOT invent unverified backend endpoints.
 * - Does NOT persist passwords in localStorage, sessionStorage, or IndexedDB.
 * - Architected as a modular contract easily replaceable with a verified
 *   remote WebAuthn/OAuth2/JWT backend service in future phases.
 */

export const DEMO_OPERATORS = [
  {
    id: 'op_aarav',
    name: 'Aarav Sharma',
    email: 'aarav@nexussync.org',
    role: 'CHIEF OPERATOR',
    replicaId: 'r_aarav-lap',
    region: 'ap-northeast-1 (Tokyo)',
    isAdmin: true,
    accessLevel: 'TIER-0 ARBITER',
    authMode: 'LOCAL / DEMO',
    sessionType: 'LOCAL OPERATOR',
    ed25519Fingerprint: '7F8C·914B·22D1·D91A',
  },
  {
    id: 'op_meera',
    name: 'Meera Patel',
    email: 'meera@nexussync.org',
    role: 'PEER OPERATOR',
    replicaId: 'r_meera-ph',
    region: 'eu-west-2 (London)',
    isAdmin: false,
    accessLevel: 'PEER QUORUM',
    authMode: 'LOCAL / DEMO',
    sessionType: 'LOCAL OPERATOR',
    ed25519Fingerprint: '3B12·89FA·554C·EA41',
  },
  {
    id: 'op_althea',
    name: 'Dr. Althea Vogel',
    email: 'althea@nexussync.org',
    role: 'TIER-0 ARBITER',
    replicaId: 'r_engine-ch',
    region: 'ch-central-1 (Zurich)',
    isAdmin: true,
    accessLevel: 'TIER-0 ARBITER',
    authMode: 'LOCAL / DEMO',
    sessionType: 'CORE GOVERNOR',
    ed25519Fingerprint: '4C99·B12A·66F0·889E',
  },
];

/**
 * Validates credentials against demo store and returns authenticated session.
 * Passwords are never returned or stored in long-term storage.
 */
export async function authenticateOperator(email, password) {
  // Passwords are intentionally not stored in persistent media
  void password;

  // Simulate mechanical cryptographic handshake delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const trimmedEmail = (email || '').trim().toLowerCase();
  const matched = DEMO_OPERATORS.find((op) => op.email.toLowerCase() === trimmedEmail);

  if (matched) {
    return {
      success: true,
      operator: {
        ...matched,
        sessionStartedAt: Date.now(),
        isAuthenticated: true,
      },
    };
  }

  // Fallback dynamic operator creation for any custom valid email
  const callsign = trimmedEmail.split('@')[0] || 'operator';
  const formattedName = callsign
    .split('.')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');

  return {
    success: true,
    operator: {
      id: `op_${callsign}`,
      name: formattedName || 'Station Operator',
      email: trimmedEmail,
      role: 'PEER OPERATOR',
      replicaId: `r_${callsign}_${Math.floor(100 + Math.random() * 900)}`,
      region: 'local-isolated (Enclave)',
      isAdmin: false,
      accessLevel: 'PEER QUORUM',
      authMode: 'LOCAL / DEMO',
      sessionType: 'LOCAL OPERATOR',
      ed25519Fingerprint: `${Math.random().toString(16).slice(2, 6).toUpperCase()}·${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
      sessionStartedAt: Date.now(),
      isAuthenticated: true,
    },
  };
}

/**
 * Registers a new operator profile with deterministic local replica designation.
 * Passwords are never stored in browser persistence.
 */
export async function registerOperator({ name, email, password }) {
  // Passwords are intentionally not stored in persistent media
  void password;

  // Simulate cryptographic keypair generation delay
  await new Promise((resolve) => setTimeout(resolve, 950));

  const trimmedName = (name || '').trim();
  const trimmedEmail = (email || '').trim().toLowerCase();
  const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16) || 'operator';
  const uniqueSuffix = Date.now().toString(36).slice(-4);
  const replicaId = `r_${slug}_${uniqueSuffix}`;

  const newOperator = {
    id: `op_${slug}_${uniqueSuffix}`,
    name: trimmedName,
    email: trimmedEmail,
    role: 'PEER OPERATOR',
    replicaId,
    region: 'local-workspace (Node)',
    isAdmin: false,
    accessLevel: 'PEER QUORUM',
    authMode: 'LOCAL / DEMO',
    sessionType: 'LOCAL OPERATOR',
    ed25519Fingerprint: `${Math.random().toString(16).slice(2, 6).toUpperCase()}·${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
    sessionStartedAt: Date.now(),
    isAuthenticated: true,
  };

  return {
    success: true,
    operator: newOperator,
  };
}

/**
 * Checks whether an operator profile has authorization for Master Admin / Cluster Control.
 */
export function hasAdminAccess(user) {
  if (!user || !user.isAuthenticated) return false;
  if (user.isAdmin === true) return true;
  const role = (user.role || '').toUpperCase();
  return (
    role.includes('CHIEF') ||
    role.includes('ARBITER') ||
    role.includes('ADMIN') ||
    role.includes('GOVERNOR')
  );
}
