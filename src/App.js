import React, {useState} from 'react'
import './App.css'
import {FillBox, Spacer, Toolbar} from './layout.js'
import {TodoApp} from './todoapp.js'
import {MailApp} from './mailapp.js'
import {List, Mail, FileText, Maximize2} from "react-feather"
import {NotesApp} from './notesapp.js'

function App() {
    const [app, setApp] = useState('todo')
    const switchTodo = () => setApp('todo')
    const switchMail = () => setApp('mail')
    const switchNotes = () => setApp('notes')
    let appcontent = ""
    if(app === 'todo') appcontent = <TodoApp/>
    if(app === 'mail') appcontent = <MailApp/>
    if(app === 'notes') appcontent = <NotesApp/>

    const enterFullscreen = () => {

    }

    return <FillBox>
        <Toolbar>
            <button onClick={switchTodo}><List/> todo</button>
            <button onClick={switchMail}><Mail/> mail</button>
            <button onClick={switchNotes}><FileText/> notes</button>
            <Spacer/>
            <button disabled={true} onClick={enterFullscreen}><Maximize2/> full screen</button>
        </Toolbar>
        {appcontent}
    </FillBox>
}
export default App
