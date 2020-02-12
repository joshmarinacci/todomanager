import React, {useContext, useEffect, useState} from 'react'
import {CSS, DialogContext, HBox, Spacer} from '../common/layout.js'
import {AUTH_URL, AuthContext, AuthModuleSingleton, BASE_URL, LOGIN} from '../auth.js'
import {COLOR_THEME, SettingsContext} from '../common/settings.js'

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
        const h = () => setLoggedIn(auth.isLoggedIn())
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

    const sm = useContext(SettingsContext)
    const [spacing,setSpacing] = useState(sm.getSpacing())
    const [color, setColor] = useState(sm.getTheme())
    return <div className={css}>
        <header>Settings</header>
        <div className='body'>
            <label>change your theme</label>
            <HBox>
                <label>spacing</label>
                <select value={spacing} onChange={(e)=>{
                    const v = e.target.value
                    sm.setSpacing(v)
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
                    sm.setTheme(v)
                    setColor(v)
                }}>
                    {Object.keys(COLOR_THEME).map(key => {
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
