export const LOGIN = "LOGIN"
export class AuthModuleSingleton {
    constructor() {
        this.listeners = {}
        this.connected = false
    }

    on(type, cb) {
        if (!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].push(cb)
    }

    off(type, cb) {
        if (this.listeners[type])
            this.listeners[type] = this.listeners[type].filter(c => c !== cb)
    }

    fire(type, payload) {
        if (!this.listeners[type]) this.listeners[type] = []
        this.listeners[type].forEach(cb => cb(payload))
    }

    isConnected() {
        return this.connected
    }

    isLoggedIn() {
        if (localStorage.getItem('access-token')) return true
        return false
    }

    login = (AUTH_URL) => {
        this.win = window.open(AUTH_URL, '_blank')
        window.addEventListener('message', this.authCallback)
        if (this.win) this.win.focus()
    }
    logout = () => {
        localStorage.clear()
        this.fire(LOGIN, {})
    }

    authCallback = (msg) => {
        console.log("got the auth callback", msg.data)
        localStorage.setItem('access-token', msg.data.payload.accessToken)
        localStorage.setItem('username', msg.data.payload.username)
        this.win.close()
        window.removeEventListener('message', this.authCallback)
        this.fire(LOGIN, {})
    }

    getAccessToken() {
        return localStorage.getItem('access-token')
    }

    getUsername() {
        return localStorage.getItem('username')
    }

    fetch(url, options) {
        options.mode = 'cors'
        options.cache = 'no-cache'
        if (!options.headers) options.headers = {}
        options.headers["access-key"] = this.getAccessToken()
        console.log("fetching", url, 'with options', options)
        return fetch(url, options)
            .then(res => {
                if (res.status === 404) throw new Error(res.statusText + " " + res.url)
                return res
            })
    }
}
