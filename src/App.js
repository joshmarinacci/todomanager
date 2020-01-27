import React, {useState} from 'react'
import './App.css'
import {FillBox, Toolbar} from './layout.js'
import {TodoApp} from './todoapp.js'
import {MailApp} from './mailapp.js'

function App() {
    const [app, setApp] = useState('mail')
    const switchTodo = () => setApp('todo')
    const switchMail = () => setApp('mail')
    let appcontent = ""
    if(app === 'todo') appcontent = <TodoApp/>
    if(app === 'mail') appcontent = <MailApp/>

    return <FillBox>
        <Toolbar>
            <button onClick={switchTodo}>todo</button>
            <button onClick={switchMail}>mail</button>
        </Toolbar>
        {appcontent}
    </FillBox>
}
export default App
