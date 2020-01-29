import React, {useContext, useEffect, useRef, useState} from 'react'
import {StorageContext, useQuery} from './storage.js'
import {useActionScope} from './actions.js'
import {FocusContext, GenericListView, makeClassNames} from './layout.js'
import {Star, Trash, Trash2, CheckSquare} from "react-feather"

const ProjectItemView = ({item,selected,focusName})=> {
    const project = item
    const [editing, setEditing] = useState(false)
    let icon = <CheckSquare/>
    const storage = useContext(StorageContext)
    const input = useRef()
    const div = useRef()

    const fm = useContext(FocusContext)
    useEffect(() => {
        const check = () => {
            if (div.current && selected && fm.getMasterFocus() === focusName) div.current.focus()
        }
        check()
        fm.on(check)
        return ()=>fm.off(check)
    })

    useEffect(()=> {
        if (input.current) {
            input.current.focus()
        }
    })

    if(project.special && project.title === 'today')  icon = <Star/>
    if(project.special && project.title === 'trash')  icon = <Trash2/>
    if(editing) {
        return (<div>
            <input ref={input} type={'text'} value={project.title} onChange={(e)=>{
                storage.update("projects",project,'title',e.target.value)
            }}
                   onKeyDown={(e)=>{
                       if(e.key === 'Enter') {
                           fm.popMasterFocus()
                           setEditing(false)
                       }
                   }}
            />
            </div>)
    } else {
        return <div ref={div} tabIndex={0} onDoubleClick={() => {
            setEditing(true)
            fm.pushMasterFocus('edit')
        }}> {icon} <b className={"title"}>{project.title}</b></div>
    }
}

export const ProjectsListView = ({selectedProject, setSelectedProject})=> {
    const storage = useContext(StorageContext)
    const [apq] = useState(()=> storage.createQuery('projects',()=>true))
    const [projects] = useQuery(apq)
    const fm = useContext(FocusContext)
    const handlers = useActionScope('list',{
        'focus-prev-master': () => {
        },
        'focus-next-master': () => {
            fm.setMasterFocus('items')
        },
        'move-selection-prev':()=>{
            const index = projects.indexOf(selectedProject)
            if(index > 0) setSelectedProject(projects[index-1])
        },
        'move-selection-next':()=>{
            const index = projects.indexOf(selectedProject)
            if(index < projects.length-1) setSelectedProject(projects[index+1])
        },
    })
    return <div onKeyDown={handlers.onKeyDown} className={'projects-list-view'}>
        <GenericListView
            ItemTemplate={ProjectItemView}
            selectedItem={selectedProject}
            setSelectedItem={setSelectedProject}
            focusName={'projects'}
            query={apq}
            autoFocus={false}
        />
    </div>
}
