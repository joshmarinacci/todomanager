import React, {useContext, useEffect, useRef, useState} from 'react'
import {StorageContext, useQuery} from './storage.js'
import {useActionScope} from './actions.js'
import {makeClassNames} from './layout.js'
import {Star, Trash, Trash2, CheckSquare} from "react-feather"

const ProjectItemView = ({selectedProject, setSelectedProject, project, listFocused})=> {
    const hbox = useRef()
    useEffect(()=>{
        if(listFocused && selectedProject === project) hbox.current.focus()
    },[listFocused, selectedProject, project])
    const cls = makeClassNames({
        selected:(project===selectedProject),
        hbox:true,
        'project-item':true,
    })
    let icon = <CheckSquare/>
    if(project.special && project.title === 'today')  icon = <Star/>
    if(project.special && project.title === 'trash')  icon = <Trash2/>
    return <div ref={hbox} tabIndex={0} className={cls} key={project.id}
                onClick={()=>{
                    setSelectedProject(project)
                    hbox.current.focus()
                }}
    > {icon} <b className={"title"}>{project.title}</b></div>
}

export const ProjectsListView = ({selectedProject, setSelectedProject, focusedList})=> {
    const storage = useContext(StorageContext)
    const [apq] = useState(()=> storage.createQuery('projects',()=>true))
    const [projects] = useQuery(apq)
    const box = useRef()
    const handlers = useActionScope('list',{
        'move-selection-prev':()=>{
            const index = projects.indexOf(selectedProject)
            if(index > 0) setSelectedProject(projects[index-1])
        },
        'move-selection-next':()=>{
            const index = projects.indexOf(selectedProject)
            if(index < projects.length-1) setSelectedProject(projects[index+1])
        },
    })
    useEffect(()=>{
        if(focusedList === 'lists' && box.current) box.current.focus()
    },[focusedList])
    const cls = makeClassNames({
        vbox:true,
        'list-view':true,
        focused:(focusedList==='lists')
    })
    return <div ref={box} className={cls} onKeyDown={handlers.onKeyDown}>
        {projects.map(project => <ProjectItemView
            key={project.id}
            project={project}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            listFocused={focusedList==='lists'}
        />)}
    </div>
}
