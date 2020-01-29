import React, {useContext, useEffect, useRef, useState} from 'react'
import {StorageContext, useQuery} from './storage.js'
import {useActionScope} from './actions.js'
import {FocusContext, GenericListView, makeClassNames} from './layout.js'
import {Star, Trash, Trash2, CheckSquare} from "react-feather"

const ProjectItemView = ({item})=> {
    const project = item
    let icon = <CheckSquare/>
    if(project.special && project.title === 'today')  icon = <Star/>
    if(project.special && project.title === 'trash')  icon = <Trash2/>
    return <div> {icon} <b className={"title"}>{project.title}</b></div>
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
    return <div onKeyDown={handlers.onKeyDown}>
        <GenericListView
            className={'projects-list-view'}
            ItemTemplate={ProjectItemView}
            selectedItem={selectedProject}
            setSelectedItem={setSelectedProject}
            focusName={'projects'}
            query={apq}
        />
    </div>
}
