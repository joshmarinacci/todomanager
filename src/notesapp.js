import {QueryStorage, StorageContext} from './storage.js'
import {ActionContext, AM} from './actions.js'
import {FocusContext, FocusManager} from './layout.js'
import React from 'react'

export const NotesApp = () => {
    const storage = new QueryStorage("notes")
    function makeInitialData() {
        storage.insert('projects', {title: 'everything', special: true})
        const good = storage.insert('projects', {title: 'good'})
        storage.insert('projects', {title: 'trash', special: true})
        storage.insert("notes", {
            id: 1,
            title: 'first, that I can forget',
            body: 'this is some notes: https://www.mozilla.com/',
            tags: ['foo'],
            sortOrder: Math.floor(Math.random()*10*1000*1000),
            deleted: false,
            project: good.id
        })
    }
    storage.load().then(()=>{
        if(storage.isEmpty()) makeInitialData()
        const projs = storage.findAll('projects',()=>true)
        projs.forEach((proj) => {
            if(proj.title === 'trash') return proj.sortOrder = Number.MAX_SAFE_INTEGER
            if(!('sortOrder' in proj)) {
                proj.sortOrder = Math.floor(Math.random()*10*1000*1000)
            }
        })

        const notes = storage.findAll('notes',()=>true)
        notes.forEach(note => {

        })
        storage.save()
    })
    AM.registerKeys([

        //navigation
        {action: 'shift-selection-prev', key:'ArrowUp', alt:true, scope:'list'},
        {action: 'shift-selection-next', key:'ArrowDown', alt:true, scope:'list'},
        {action: 'move-selection-prev', key: 'ArrowUp', scope: 'list'},
        {action: 'move-selection-prev', key: 'k', scope: 'list'},
        {action: 'move-selection-next', key: 'ArrowDown', scope: 'list'},
        {action: 'move-selection-next', key: 'j', scope: 'list'},
        {action: 'focus-prev-master',  key:'ArrowLeft',  scope:'list'  },
        {action: 'focus-next-master',  key:'ArrowRight',  scope:'list'  },

        //list scope
        {action: 'add-item-to-target-list',  scope:'list',  key: 'N',  control:true,  shift:true,  },
        {action: 'add-item-to-target-list',  scope:'list',  key: 'N',  alt:true, },
        {action: 'toggle-completed', scope:'list', key: 'period',  control:true},
        {action: 'toggle-completed', scope: 'list', key: 'period',  alt:true },
        {action: 'toggle-today',  scope: 'list', key:'t',  control:true,  shift:true },
        {action: 'toggle-today',  scope:'list',  key:'t',  alt:true },
        {action: 'delete-item',   scope:'list',  key:'backspace' },

        //item scope
        {action: 'edit-item',   key: 'Enter',  scope:'item',  },
        { action: 'exit-edit-item',   key:'escape', scope:'edit-item',   },
    ])

    return <ActionContext.Provider value={AM}>
        <StorageContext.Provider value={storage}>
            <FocusContext.Provider value={new FocusManager()}>
                <NotesAppContent/>
            </FocusContext.Provider>
        </StorageContext.Provider>
    </ActionContext.Provider>
}

const NotesAppContent = ()=>{
    return <div>
        notes app
    </div>
}
