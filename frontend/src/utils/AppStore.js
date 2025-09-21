window.AppStore = {
  user: null,

  setUser(userData) {
    this.user = userData
    if (userData) {
      localStorage.setItem("lokKalaUser", JSON.stringify(userData))
    } else {
      localStorage.removeItem("lokKalaUser")
    }
  },

  getUser() {
    if (this.user) return this.user

    const stored = localStorage.getItem("lokKalaUser")
    if (stored) {
      try {
        this.user = JSON.parse(stored)
        return this.user
      } catch (e) {
        localStorage.removeItem("lokKalaUser")
      }
    }
    return null
  },

  logout() {
    this.user = null
    localStorage.removeItem("lokKalaUser")
  },

  isLoggedIn() {
    return !!this.getUser()
  },
}
