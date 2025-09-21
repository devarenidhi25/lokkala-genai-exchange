"use client"

const React = window.React
const { useMemo } = React

function PasswordStrength({ value = "" }) {
  const { level, pct } = useMemo(() => {
    const s = window.scorePassword(value)
    return window.strengthLevel(s)
  }, [value])

  return (
    <div className={`mt-2 strength-${level}`}>
      <div className="strength-bar">
        <div className="strength-bar-fill" style={{ width: `${pct}%` }}></div>
      </div>
      <div className="small text-muted mt-2">
        Strength:{" "}
        <span className="bold" style={{ textTransform: "capitalize" }}>
          {level}
        </span>
      </div>
    </div>
  )
}

window.PasswordStrength = PasswordStrength
