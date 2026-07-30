const store = new Map()

const TTL = 10 * 60 * 1000

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function set(email, otp) {
  const expiresAt = Date.now() + TTL
  store.set(email, { otp, expiresAt })
  setTimeout(() => store.delete(email), TTL)
}

function verify(email, otp) {
  const entry = store.get(email)
  if (!entry) return false
  if (Date.now() > entry.expiresAt) {
    store.delete(email)
    return false
  }
  if (entry.otp !== otp) return false
  store.delete(email)
  return true
}

module.exports = { generateOTP, set, verify }
