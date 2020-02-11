import React, {useContext, useEffect, useRef, useState} from 'react'
import './App.css'
import {CSS, DialogContainer, DialogContext, DialogManager, Spacer, Toolbar} from './common/layout.js'
import {TodoApp} from './todo/todoapp.js'
import {MailApp} from './mail/mailapp.js'
import {FileText, List, Mail, Maximize2, Minimize2, Settings, Wifi, WifiOff} from "react-feather"
import {NotesApp} from './notes/notesapp.js'

const ConnectedButton = () => {
    const [online, setOnline] = useState(window.navigator.onLine)
    useEffect(()=>{
        const h = () =>  setOnline(window.navigator.onLine)
        window.addEventListener('online',h)
        window.addEventListener('offline',h)
        return ()=>{
            window.removeEventListener('online',h)
            window.removeEventListener('offline',h)
        }
    })
    if(online) {
        return <Wifi/>
    } else {
        return <WifiOff/>
    }
}

const FullscreenButton = ({top}) => {
    const [full, setFull] = useState(false)
    const toggleFullscreen = () => {
        if (full) return document.exitFullscreen().then(() => setFull(false))
        if (top.current) return top.current.requestFullscreen().then(() => setFull(true))
    }

    let fsicon = full ? <Minimize2/> : <Maximize2/>

    return <button onClick={toggleFullscreen}>{fsicon}</button>
}

function App() {
    const [app, setApp] = useState('todo')
    const switchTodo = () => setApp('todo')
    const switchMail = () => setApp('mail')
    const switchNotes = () => setApp('notes')
    let appcontent = ""
    if (app === 'todo') appcontent = <TodoApp/>
    if (app === 'mail') appcontent = <MailApp/>
    if (app === 'notes') appcontent = <NotesApp/>

    const top = useRef()

    return <div className={'fillbox main-wrapper'} ref={top}>
        <div className={'toolbar vertical left-edge'}>
            <ConnectedButton/>
            <FullscreenButton top={top}/>
            <button onClick={switchTodo}  className={CSS({selected:app==='todo'})}><List/> todo</button>
            <button onClick={switchMail}  className={CSS({selected:app==='mail'})}><Mail/> mail</button>
            <button onClick={switchNotes} className={CSS({selected:app==='notes'})}><FileText/> notes</button>
            <Spacer/>
        </div>
        {appcontent}
    </div>
}

export default App
