// Password strength scoring: length, variety
function scorePassword(pw) {
  if (!pw) return 0
  let score = 0
  const letters = {}
  for (let i = 0; i < pw.length; i++) {
    letters[pw[i]] = (letters[pw[i]] || 0) + 1
    score += 5.0 / letters[pw[i]]
  }
  const variations = {
    digits: /\d/.test(pw),
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    nonWords: /\W/.test(pw),
  }
  let variationCount = 0
  for (const check in variations) variationCount += variations[check] ? 1 : 0
  score += (variationCount - 1) * 10
  if (pw.length >= 12) score += 15
  return Number.parseInt(score, 10)
}

function strengthLevel(score) {
  if (score < 30) return { level: "weak", pct: 25 }
  if (score < 50) return { level: "fair", pct: 50 }
  if (score < 80) return { level: "good", pct: 75 }
  return { level: "strong", pct: 100 }
}

// Aadhaar Verhoeff algorithm
// Ref: public domain implementation adapted for client-side validation.
const verhoeff_d = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 4, 0],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]
const verhoeff_p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 3, 4, 2, 7, 0, 5],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 8, 1, 3, 2, 5, 9],
]

function verhoeffValidate(num) {
  if (!/^\d{12}$/.test(num)) return false
  let c = 0
  const myArray = num.split("").reverse().map(Number)
  for (let i = 0; i < myArray.length; i++) {
    c = verhoeff_d[c][verhoeff_p[i % 8][myArray[i]]]
  }
  return c === 0
}

// Phone simple validation
function validPhone(phone) {
  return /^\d{10}$/.test(phone)
}

// Expose a friendly API too:
window.Validators = {
  scorePassword,
  strengthLevel,
  isValidAadhaar: verhoeffValidate,
  validPhone,
}
export { scorePassword, strengthLevel, verhoeffValidate, validPhone }
