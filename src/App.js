import React, {useState} from 'react'
import './App.css'
import {FillBox, Toolbar} from './layout.js'
import {TodoApp} from './todoapp.js'
import {MailApp} from './mailapp.js'
import {List, Mail} from "react-feather"

function App() {
    const [app, setApp] = useState('mail')
    const switchTodo = () => setApp('todo')
    const switchMail = () => setApp('mail')
    let appcontent = ""
    if(app === 'todo') appcontent = <TodoApp/>
    if(app === 'mail') appcontent = <MailApp/>

    return <FillBox>
        <Toolbar>
            <button onClick={switchTodo}><List/> todo</button>
            <button onClick={switchMail}><Mail/> mail</button>
        </Toolbar>
        {appcontent}
    </FillBox>
}
export default App
