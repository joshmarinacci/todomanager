import {createContext, useContext} from 'react'

const SETTINGS = 'SETTINGS_STORAGE_KEY'
export const COLOR_THEME = {
    'default': {
        '--tool-bg': '#aaaaaa',
        '--tool-fg': '#333',
        '--content-bg': '#dddddd',
        '--focus-bg': '#ffffff',
        '--active-bg': 'aquamarine'
    },
    'desert-night':{
        '--tool-bg': '#765D69',
        '--tool-fg': '#f0f0f0',
        '--content-bg': '#FCD0BA',
        '--focus-bg': '#FEFAD4',
        '--active-bg': '#F1828D',
    },
    'gradient': {
        '--tool-bg':'linear-gradient(to right, #cfd9df, #e2ebf0)',
        '--tool-fg':'#333',
        '--active-bg':'linear-gradient(to right, aqua, aquamarine)',
        '--content-bg':'#f0f0f0',
    }
}
export const SPACING = {
    'comfortable': '1.0rem',
    'tight':'0.5rem',
}


export class SettingsManager {
    constructor() {
        try {
            this.settings = JSON.parse(localStorage.getItem(SETTINGS))
        } catch (e) {
            this.settings = {
                theme:'default',
                spacing:'comfortable',
            }
        }
        if(!this.settings) {
            this.settings = {
                theme:'default',
                spacing:'comfortable',
            }
        }
        if(!this.settings.spacing) {
            this.settings.spacing = 'comfortable'
        }
        console.log("settings manager loaded",this.settings)
        this.applyTheme(this.settings.theme)
        this.applySpacing(this.settings.spacing)
    }

    getTheme() {
        return this.settings.theme
    }
    setTheme(themeName) {
        this.settings.theme = themeName
        this.applyTheme(themeName)
        localStorage.setItem(SETTINGS,JSON.stringify(this.settings))
    }

    applyTheme(themeName) {
        const theme = COLOR_THEME[themeName]
        Object.keys(theme).forEach(key => {
            document.documentElement.style.setProperty(key,theme[key])
        })
    }

    getSpacing() {
        return this.settings.spacing
    }
    setSpacing(spacingName) {
        this.settings.spacing = spacingName
        this.applySpacing(spacingName)
        localStorage.setItem(SETTINGS,JSON.stringify(this.settings))
    }
    applySpacing(spacingName) {
        console.log("applying the spacing name", spacingName)
        document.documentElement.style.setProperty('--spacing',SPACING[spacingName])
    }
}

export const SettingsContext = createContext()
