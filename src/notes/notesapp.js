import {QueryStorage, StorageContext, useQuery} from '../common/storage.js'
import {ActionContext, AM, ShortcutsPanel} from '../common/actions.js'
import {FocusContext, FocusManager, Toolbar, VBox} from '../common/layout.js'
import React, {useContext, useState} from 'react'
import {ProjectsListView} from '../todo/projects.js'
import './notes.css'
import {NoteEditor, NotesListView} from './notes.js'

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
            if(!('lastEditedTimestamp' in note)) {
                note.lastEditedTimestamp = Date.now()
            }
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
        {action: 'add-note-to-target-list',  scope:'list',  key: 'N',  control:true,  shift:true,  },
        {action: 'add-note-to-target-list',  scope:'list',  key: 'N',  alt:true, },
        {action: 'toggle-completed', scope:'list', key: 'period',  control:true},
        {action: 'toggle-completed', scope: 'list', key: 'period',  alt:true },
        {action: 'toggle-today',  scope: 'list', key:'t',  control:true,  shift:true },
        {action: 'toggle-today',  scope:'list',  key:'t',  alt:true },
        {action: 'delete-note',   scope:'list',  key:'backspace' },

        //item scope
        {action: 'edit-item',   key: 'Enter',  scope:'item', },
        {action: 'exit-edit-item',   key:'escape', scope:'edit-item', },
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
    const storage = useContext(StorageContext)
    const [selectedProject,setSelectedProject] = useState(null)
    const [query,setQuery] = useState(()=>{
        return storage.createQuery('notes',(it)=>(selectedProject && it.project === selectedProject.id))
    })
    const [selectedNote, setSelectedNote] = useState(null)
    const changeSelectedProject = (project) => {
        setSelectedProject(project)
        if(project.special) {
            if(project.title === 'everything') return setQuery(storage.createQuery('notes', () => true))
            if(project.title === 'trash') return setQuery(storage.createQuery(
                'notes',
                it => it.deleted === true, // all deleted notes
                (a,b)=>a.lastEditedTimestamp-b.lastEditedTimestamp // sort by last modified
                ))
        } else {
            return setQuery(storage.createQuery('notes',
                (it)=>it.project===project.id  , // only notes in the current project
                (a,b)=>a.lastEditedTimestamp-b.lastEditedTimestamp)) // sort by last modified
        }
    }
    return <VBox className={'notesapp-grid'}>
        <Toolbar className={'grid-toolbar'}>
            {/*<SearchBox searching={searching} setSearching={endSearching} setQuery={setQuery}/>*/}
        </Toolbar>
        <ProjectsListView selectedProject={selectedProject} setSelectedProject={changeSelectedProject} nextFocusTarget={"notes"}/>
        <NotesListView query={query} project={selectedProject} selectedNote={selectedNote} setSelectedNote={setSelectedNote}/>
        <NoteEditor note={selectedNote}/>
        {/*<VBox>*/}
        {/*    <h3>Shortcuts</h3>*/}
        {/*    <ShortcutsPanel/>*/}
        {/*</VBox>*/}
    </VBox>
}
