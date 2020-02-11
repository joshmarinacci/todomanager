import React, {useContext, useEffect, useState} from 'react'
import {CSS, DialogContext, HBox, Spacer} from '../common/layout.js'
import {AUTH_URL, AuthContext, AuthModuleSingleton, BASE_URL, LOGIN} from '../auth.js'

const SPACING = {
    'comfortable': '1.0rem',
    'tight':'0.5rem',
}
const COLOR_THEME = {
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

export const SettingsDialog = () => {
    const dm = useContext(DialogContext)
    const auth = useContext(AuthContext)
    const [loggedIn,setLoggedIn] = useState(auth.isLoggedIn())
    const css = CSS({
        dialog:'true'
    })
    const hide = () => {
        dm.hide()
    }

    useEffect(()=>{
        const h = () => {
            setLoggedIn(auth.isLoggedIn())
            if(auth.isLoggedIn()) {
                console.log("doing an authed fetch")
                auth.fetch(`${BASE_URL}joshmarinacci/search`)
                    .then(res => res.json())
                    .then((data)=>{
                        console.log("got back data",data)
                    })
            }
        }
        auth.on(LOGIN,h)
        return ()=>auth.off(LOGIN,h)
    })
    const doLoginLogout = () => {
        if(auth.isLoggedIn()) {
            auth.logout()
        } else {
            auth.login(AUTH_URL)
        }
    }

    const [spacing,setSpacing] = useState('comfortable')
    const [color, setColor] = useState('default')
    return <div className={css}>
        <header>Settings</header>
        <div className='body'>
            <label>change your theme</label>
            <HBox>
                <label>spacing</label>
                <select value={spacing} onChange={(e)=>{
                    const v = e.target.value
                    document.documentElement.style.setProperty('--spacing',SPACING[v])
                    setSpacing(v)
                }}>
                    <option value={"comfortable"}>comfortable</option>
                    <option value={"tight"}>tight</option>
                </select>
            </HBox>
            <HBox>
                <label>color</label>
                <select value={color} onChange={e => {
                    const v = e.target.value
                    const theme = COLOR_THEME[v]
                    Object.keys(theme).forEach(key => {
                        document.documentElement.style.setProperty(key,theme[key])
                    })
                    setColor(v)
                }}>
                    {Object.keys(COLOR_THEME).map(key => {
                        console.log('theme',key)
                        return <option key={key} value={key}>{key}</option>
                    })}
                </select>
            </HBox>
            <button onClick={doLoginLogout}>{loggedIn?'logout':'login'}</button>
        </div>
        <footer>
            <Spacer/>
            <button onClick={hide}>done</button>
        </footer>
    </div>
}
