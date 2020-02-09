import React, {useContext, useEffect, useRef, useState} from 'react'
import {StorageContext, useQuery} from '../common/storage2.js'
import {useActionScope} from '../common/actions.js'
import {FocusContext, GenericListView, Spacer, useAutofocusRefWhenSelected} from '../common/layout.js'
import {CheckSquare, Coffee, Square, Star, Trash2} from "react-feather"


const ProjectItemView = ({item, selected, focusName}) => {
    const project = item
    const [editing, setEditing] = useState(false)
    const storage = useContext(StorageContext)
    const input = useRef()
    const div = useRef()

    const fm = useContext(FocusContext)
    const startEditing = () => {
        if (item.special) return
        setEditing(true)
        fm.pushMasterFocus('edit')
    }

    useAutofocusRefWhenSelected(div, selected, focusName)

    useEffect(() => {
        if (input.current) input.current.focus()
    }, [editing])

    let icon = <Square/>
    if (project.special && project.title === 'today') icon = <Star/>
    if (project.special && project.title === 'trash') icon = <Trash2/>
    if (project.special && project.title === 'completed') icon = <CheckSquare/>
    if (project.special && project.title === 'everything') icon = <Coffee/>
    if (editing) {
        return (<div className={'hbox project-item'}> {icon}
            <input ref={input} type={'text'} className={'grow'}
                   value={project.title} onChange={(e) => {
                storage.updateObject("project", project, 'title', e.target.value)
            }}
                   onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                           fm.popMasterFocus()
                           setEditing(false)
                       }
                   }}
            />
        </div>)
    } else {
        return <div ref={div} tabIndex={0} className={'hbox project-item'}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') startEditing()
                    }}
                    onDoubleClick={startEditing}>
            {icon}
            <b className={"title"}>{project.title}</b> <Spacer/>
        </div>
    }
}

export const ProjectsListView = ({selectedProject, setSelectedProject, nextFocusTarget = "items"}) => {
    const storage = useContext(StorageContext)
    const [apq] = useState(() => storage.createQuery({
        table:'project', // only projects
        find:() => true, // all projects
        sort:(a, b) => a.sortOrder - b.sortOrder // sort by the sort order
        }))
    const projects = useQuery(apq)
    const fm = useContext(FocusContext)
    const handlers = useActionScope('list', {
        'focus-prev-master': () => {
        },
        'focus-next-master': () => {
            fm.setMasterFocus(nextFocusTarget)
        },
        'move-selection-prev': () => {
            const index = projects.indexOf(selectedProject)
            if (index > 0) setSelectedProject(projects[index - 1])
        },
        'move-selection-next': () => {
            const index = projects.indexOf(selectedProject)
            if (index < projects.length - 1) setSelectedProject(projects[index + 1])
        },
        'shift-selection-prev': () => {
            if (selectedProject.special) {
                console.log("cannot move special ones")
                return
            }
            const index = projects.indexOf(selectedProject)
            const newIndex = index - 1
            console.log("moving the selection up from", index, 'to', newIndex, selectedProject)
            if (newIndex <= 0) return console.log("can't move up past the start")
            const prev = projects[newIndex]
            console.log("prev is", prev)
            if (prev.special) {
                console.log("cant move before a special")
                return
            }
            const prevprev = projects[newIndex - 1]
            console.log("prevprev", prevprev)
            const newOrder = (prev.sortOrder + prevprev.sortOrder) / 2
            console.log("the new order is", newOrder)
            storage.updateObject('project', selectedProject, 'sortOrder', newOrder)
        },
        'shift-selection-next': () => {
            if (selectedProject.special) {
                console.log("cannot move special ones")
                return
            }
            const index = projects.indexOf(selectedProject)
            const newIndex = index + 1
            console.log('moving selection', selectedProject)
            if (newIndex > projects.length - 1) return console.log("cannot move down past the end")
            const next = projects[newIndex]
            if (next.special) return console.log("can't move above a special")
            const nextnext = projects[newIndex + 1]
            console.log("will be after", nextnext)
            const newOrder = (next.sortOrder + nextnext.sortOrder) / 2
            console.log("the new order is", newOrder)
            storage.updateObject('project', selectedProject, 'sortOrder', newOrder)
        }
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
