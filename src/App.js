import React, {useRef, useState} from 'react'
import './App.css'
import {CSS, Spacer, Toolbar} from './common/layout.js'
import {TodoApp} from './todo/todoapp.js'
import {MailApp} from './mail/mailapp.js'
import {FileText, List, Mail, Maximize2, Minimize2} from "react-feather"
import {NotesApp} from './notes/notesapp.js'

function App() {
    const [app, setApp] = useState('mail')
    const switchTodo = () => setApp('todo')
    const switchMail = () => setApp('mail')
    const switchNotes = () => setApp('notes')
    let appcontent = ""
    if (app === 'todo') appcontent = <TodoApp/>
    if (app === 'mail') appcontent = <MailApp/>
    if (app === 'notes') appcontent = <NotesApp/>

    const top = useRef()
    const [full, setFull] = useState(false)
    const toggleFullscreen = () => {
        if (full) return document.exitFullscreen().then(() => setFull(false))
        if (top.current) return top.current.requestFullscreen().then(() => setFull(true))
    }

    let fsicon = full ? <Minimize2/> : <Maximize2/>

    return <div className={'fillbox'} ref={top}>
        <Toolbar>
            <button onClick={switchTodo}
                    className={CSS({selected:app==='todo'})}><List/> todo</button>
            <button onClick={switchMail}
                    className={CSS({selected:app==='mail'})}><Mail/> mail</button>
            <button onClick={switchNotes}
                    className={CSS({selected:app==='notes'})}><FileText/> notes</button>
            <Spacer/>
            <button onClick={toggleFullscreen}>{fsicon} full screen</button>
        </Toolbar>
        {appcontent}
    </div>
}

export default App
