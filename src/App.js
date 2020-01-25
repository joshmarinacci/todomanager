import React, {useEffect, useRef, useState} from 'react'
import './App.css'
import {FillBox, HBox, VBox} from './layout.js'
import {AM, ShortcutsPanel} from './actions.js'
import {QueryStorage, useQuery} from './storage.js'

const EditableLabel = ({value, editing, doneEditing}) => {
    const [temp, setTemp] = useState(value)
    const input = useRef()
    useEffect(() => {
        if (input.current) input.current.focus()
    }, [editing])
    if (editing) {
        return <input ref={input} type="text"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                              doneEditing(temp)
                          }
                      }}
        />
    }
    return <label>{temp}</label>
}

const ListItemView = ({realItem, selected, onSelect, editable}) => {
    const [item, setItem] = useState(realItem)
    const [editing, setEditing] = useState(false)
    let sel = false
    if (selected) {
        if (selected.includes && selected.includes(item)) sel = true
        if (selected === realItem) sel = true
    }
    return <HBox className={" list-view-item " + (sel ? "selected" : "")}
                 onClick={() => onSelect(item)}
                 onDoubleClick={() => {
                     if (editable) setEditing(true)
                 }}
    >
        <EditableLabel value={item.title} editing={editing} doneEditing={(value) => {
            setEditing(false)
            storage.update('items', realItem, 'title', value)
        }}/>
    </HBox>
}

const ListView = ({am, query, selected, onSelect, storage, editable = false}) => {
    const [items] = useQuery(query)
    return <VBox className={"list-view"}
                 tabIndex={0}
                 onKeyDown={(e) => am.handleKeyDown(e, items, selected, onSelect, editable)}
    >
        {items.map(item => <ListItemView key={item.id} realItem={item} selected={selected} onSelect={onSelect}
                                         storage={storage} editable={editable}/>)}
    </VBox>
}

const storage = new QueryStorage()
const good = storage.insert('projects', {title: 'good'})
const forget = storage.insert('projects', {title: 'forget'})
const trash = storage.insert('projects', {title: 'trash'})

storage.insert("items", {
    id: 1,
    title: 'first, that I can forget',
    notes: 'this is some notes: https://www.mozilla.com/',
    tags: ['foo'],
    project: forget.id
})
storage.insert("items", {id: 2, title: 'second is good', tags: ['foo', 'bar'], project: good.id})
storage.insert("items", {id: 3, title: 'third is good', tags: ['bar'], project: good.id})

const ALL_PROJECTS = storage.createQuery('projects', () => true)

function App() {
    const [selection, setSelection] = useState([trash])
    const [query, setQuery] = useState(storage.createEmptyQuery())
    const [selItem, setSelItem] = useState(null)
    const am = AM

    return <FillBox>
        <HBox className={'grow stretch'}>
            <ListView am={am} query={ALL_PROJECTS} selected={selection} onSelect={(project) => {
                setSelection(project)
                setQuery(storage.createQuery('items', (item) => item.project === project.id))
            }}/>
            <VBox>
                <ListView query={query} selected={selItem}
                am={am}
                          onSelect={(item) => setSelItem(item)} storage={storage}
                          editable={true}/>
                <button className={'primary'} onClick={() => {
                    storage.insert('items', {
                        title: 'empty item',
                        tags: [],
                        project: good.id
                    })
                }}>add
                </button>
            </VBox>
            <VBox>
                <h3>Shortcuts</h3>
                <ShortcutsPanel actionManager={am}/>
            </VBox>
        </HBox>
    </FillBox>
}

export default App
