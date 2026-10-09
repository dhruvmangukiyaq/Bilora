/* Accounts + session — localStorage only (no backend, no login server).

   Every user gets their own account (username + password) and their own
   data key, so a shared browser keeps each user's business, invoices and
   customers separate. Passwords are salted and hashed (SHA-256 where the
   browser allows it, a self-contained hash otherwise) — that stops casual
   snooping on a shared machine; it is not a server-grade security boundary.
*/

const USERS_KEY = 'bilora.accounts.v1'
const SESSION_KEY = 'bilora.session.v1'

export const normUser = (u) => String(u ?? '').trim().toLowerCase()

/** localStorage key holding one user's business / invoices / customers. */
export const userKey = (u) => `bilora.data.v1.${normUser(u)}`

export const USERNAME_RULES = '3–20 characters: letters, numbers, dot, dash or underscore'
export const PASSWORD_RULES = 'at least 4 characters'

/* ---------------- password hashing ---------------- */

const subtle = () => {
  try {
    return globalThis.crypto && globalThis.crypto.subtle ? globalThis.crypto.subtle : null
  } catch {
    return null
  }
}

const pickAlgo = () => (subtle() ? 'sha256' : 'fnv')

async function hashPassword(password, salt, algo) {
  const mode = algo || pickAlgo()
  const text = `${salt}\u0000${password}`

  if (mode === 'sha256' && subtle()) {
    try {
      const buf = await subtle().digest('SHA-256', new TextEncoder().encode(text))
      const hex = Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
      return `sha256$${hex}`
    } catch {
      /* rare — fall through to the portable hash */
    }
  }

  /* portable fallback (plain-http hosts where crypto.subtle is unavailable) */
  let h1 = 0x811c9dc5
  let h2 = 0xdeadbeef
  for (let round = 0; round < 1200; round++) {
    const s = `${text}#${round}`
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i)
      h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0
      h2 = Math.imul(h2 + c + i, 0x85ebca6b) >>> 0
      h2 = (h2 ^ (h2 >>> 13)) >>> 0
    }
  }
  return `fnv$${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`
}

/* ---------------- accounts ---------------- */

function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' && parsed.users ? parsed.users : {}
  } catch {
    return {}
  }
}

function writeUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify({ v: 1, users }))
    return true
  } catch {
    return false
  }
}

/** Usernames registered in this browser (shown on the sign-in screen). */
export function listUsers() {
  return Object.values(readUsers())
    .map((u) => u.username)
    .sort((a, b) => a.localeCompare(b))
}

const randomSalt = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`

function validate(username, password) {
  const name = normUser(username)
  if (name.length < 3 || name.length > 20) return `Username must be ${USERNAME_RULES}`
  if (!/^[a-z0-9._-]+$/.test(name)) return `Username: ${USERNAME_RULES}`
  if (String(password ?? '').length < 4) return `Password must be ${PASSWORD_RULES}`
  return null
}

/** Create an account and sign in. Returns `{ user }` or `{ error }`. */
export async function signUp(username, password) {
  const invalid = validate(username, password)
  if (invalid) return { error: invalid }

  const name = normUser(username)
  const users = readUsers()
  if (users[name]) return { error: 'That username already exists on this browser' }

  const algo = pickAlgo()
  const salt = randomSalt()
  const hash = await hashPassword(password, salt, algo)
  if (!hash) return { error: 'Could not save that account' }

  users[name] = { username: name, salt, hash, algo, createdAt: Date.now() }
  if (!writeUsers(users)) return { error: 'Browser storage is full or blocked' }

  startSession(name)
  return { user: name }
}

/** Verify credentials and sign in. Returns `{ user }` or `{ error }`. */
export async function signIn(username, password) {
  const name = normUser(username)
  if (!name) return { error: 'Enter your username' }

  const rec = readUsers()[name]
  if (!rec) return { error: 'No account with that username in this browser' }

  const hash = await hashPassword(password, rec.salt, rec.algo)
  if (hash !== rec.hash) return { error: 'Incorrect password' }

  startSession(name)
  return { user: name }
}

/* ---------------- session (stays until Logout) ---------------- */

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    const s = raw ? JSON.parse(raw) : null
    if (!s || !s.user) return null
    if (!readUsers()[s.user]) return null // account deleted
    return s
  } catch {
    return null
  }
}

export function startSession(user) {
  const session = { user, at: Date.now() }
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    /* still usable for this tab */
  }
  return session
}

export function endSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    /* nothing to clear */
  }
}

/* ---------------- onboarding gate ---------------- */

/** Business details are filled in → the invoice studio may open. */
export const isSetUp = (business) => Boolean(String(business?.name ?? '').trim())
