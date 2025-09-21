const Storage = {
  get(key, fallback = null) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback
    } catch {
      return fallback
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
  },
  remove(key) {
    localStorage.removeItem(key)
  },
}

// Global App State (very light)
const AppStore = {
  getUser() {
    return Storage.get("user", null)
  },
  setUser(user) {
    Storage.set("user", user)
  },
  logout() {
    Storage.remove("user")
    Storage.remove("profileCustomer")
    Storage.remove("profileArtisan")
  },
  getProfile(role) {
    if (role === "customer") return Storage.get("profileCustomer", null)
    if (role === "artisan") return Storage.get("profileArtisan", null)
    return null
  },
  setProfile(role, data) {
    if (role === "customer") Storage.set("profileCustomer", data)
    if (role === "artisan") Storage.set("profileArtisan", data)
  },
}

window.Storage = Storage
window.AppStore = AppStore
export { Storage, AppStore }
