import React, {createContext} from 'react'
import {useContext} from 'react'

/*
action manager design

separate the names of actions from the input events (like keystrokes) which can invoke them
in some cases, move action code into a separate file that is less coupled with the gui
there should be some sort of a cascade so that if one part doesn't handle the input then another part will
there should be a scope so inputs can be restricted to certain areas or conditions.

ex:
  pressing the N key when an item is selected will add a new item to that same list, and right below the selected item.
  pressing the command-N key will make a new item in the currently selected list
  pressing the command-N key will make a new project if the projects list is selected
  pressing the M key will move the entire selection of items to a new project, if applicable
  pressing the up arrow key will move the current selected item up
  typing an unknown sequences of characters will search for them in all items

for the todo list let's make these actions with these keys
create-new-project: button,
create-new-item: button, control-shift-N, any scope
delete-selected-items: delete, button, list scope
delete-selected-project: context menu, button
move-selection-to-project: control-M, list scope
move-selection-to-today: control-T, list scope
move-selection-to-tomorrow: control-T, list scope, editing-item
move-selection-to-later: control-L, list scope, editing-item
move-selection-to-date: control-T, list scope, editing-item
toggle-completed: control-period, list scope, editing-item

move-selection-down: down-arrow, any scope
extend-selection-down: shift-down-arrow, only list scope
shift-selection-down: alt-down-arrow, only list scope
move-selection-up: up-arrow, any scope
extend-selection-up: shift-up-arrow, only list scope
shift-selection-up: alt-up-arrow, only list scope

find-in-all-projects: control-F, text-field, any scope
tag-selection
edit-selected-item: enter, only list scope
finish-editing-selected-item: shift-enter, escape, only editing-item scope
select-all-items: control-A, only list scope
edit-sub-items: tab, only editing-item scope
edit-due-date: tab, only editing-item scope
edit-item-notes: tab, only editing item scope
goto-project-of-item: shift-control-P, only list scope or editing item scope


in general the rules of keystrokes are:
* f means find
* arrows means navigate or move something to a place
* enter means edit or go into
* shift-enter or escape means exit or go out of




## common set/list operations

add a bunch of stuff at once from args or arrays
sort by a key
pick the first N items
to JSON
to String (for console output)
group by a key
filter by a condition
filter by a key and a condition
sort by a key

createSetUniqueByKey('id').addLots(a,b,c,d,e,f,g).sort()
listOfObjects.groupByKey('url','count').sortByKey('count').pick(10).toJSON()


 */
class ActionManager {
    constructor() {
        this.actionsMap = {}
        this.keysList = []
    }
    registerActions(map) {
        this.actionsMap = map
    }
    registerKeys(arr) {
        this.keysList = arr
    }
    getShortcuts() {
        const map = {}
        this.keysList.forEach(binding => {
            if(!map[binding.action]) map[binding.action] = []
            let str = binding.key
            if(binding.control) str = 'ctrl+'+str
            map[binding.action].push(str)
        })
        const arr = []
        Object.keys(map).forEach(key=>{
            arr.push({
                name:key,
                keys:map[key]
            })
        })
        return arr
    }
    handleKeyDown(event) {
        // console.log("key is",event)
        if(event.key === 'Control') return
        const binding = this.keysList.find(binding=> {
            if(binding.key === event.key) {
                if(binding.control && event.ctrlKey) return true
                if(!binding.control && !event.ctrlKey) return true
                return false
            }
            return false
        })
        console.log("found the binding",binding)
        if(binding) {
            event.preventDefault()
            event.stopPropagation()
            const action = this.actionsMap[binding.action]
            return action
        }
    }
    matchBinding(event) {
        // console.log("key is",event)
        if(event.key === 'Control') return
        const binding = this.keysList.find(binding=> {
            if(binding.key === event.key) {
                if(binding.control && event.ctrlKey) return true
                if(!binding.control && !event.ctrlKey) return true
                return false
            }
            return false
        })
        return binding
    }
    getAction(str) {
        const action = this.actionsMap[str]
        return action
    }
}

const am = new ActionManager()
am.registerActions({
    'edit-item': (scope)=>{
        console.log("starting to edit",scope.item)
    },
    'list-nav-prev': (items,selected,onSelect) => {
        const index = items.indexOf(selected)
        if(index > 0) onSelect(items[index-1])
    },
    'list-nav-next': (items,selected,onSelect) => {
        const index = items.indexOf(selected)
        if(index < items.length -1) onSelect(items[index+1])
    },
    'list-nav-edit-item': (sel) => sel.startEditing(),
    'add-item-to-target-list': (storage,project) => {
        console.log("inserting into the project",project)
        storage.insert('items', {
            title: 'empty item',
            tags: [],
            project:project.id
        })
    }
})

am.registerKeys([
    {
        key: 'ArrowUp',
        scope:'list',
        action: 'move-selection-prev',
    },
    {
        key:'ArrowUp',
        shift:true,
        scope: 'list',
        action: 'extend-selection-prev',
    },
    {
        key:'ArrowUp',
        alt:true,
        scope: 'items',
        action: 'shift-selection-prev',
    },

    {
        key: 'ArrowDown',
        scope:'list',
        action: 'move-selection-next',
    },
    {
        key: 'ArrowDown',
        shift:true,
        scope:'list',
        action: 'extend-selection-next',
    },
    {
        key: 'ArrowDown',
        alt:true,
        scope:'items',
        action: 'shift-selection-next',
    },



    {
        key: 'N',
        control:true,
        shift:true,
        action: 'create-item-selected-project',
    },
    {
        key: 'Enter',
        scope:'item',
        action: 'edit-item',
    },
    {
        key: 'period',
        control:true,
        action: 'toggle-completed',
    },
    {
        key:'delete',
        control:true,
        scope:'items',
        action:'delete-selected-items',
    },

    {
        key:'f',
        control:true,
        action:'find-item'
    }
])

export const ActionContext = createContext(am)

export const ShortcutsPanel = () => {
    const am = useContext(ActionContext)
    return <ul className={'grow shortcuts'}>{am.getShortcuts().map((sc, i) => {
        return <li key={i}>{sc.name}
            <ul>{sc.keys.map((key, i)=>{
                return <li key={i}>{key.toString()}</li>
            })}</ul>
        </li>
    })}</ul>
}

export const AM = am


export const useActionScope = (scope,actions)=>{
    const am = useContext(ActionContext)
    return {
        onKeyPress:(e) => {
            console.log("key was pressed")
        },
        onKeyDown: (e) => {
            console.log("keydown",e.key)
            const binding = am.matchBinding(e)
            console.log("matched the binding",binding)
            console.log('actions',actions)
            if(binding && actions[binding.action]) actions[binding.action]()
        }
    }
}
