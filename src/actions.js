import React from 'react'
import {useContext} from 'react'

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
    handleKeyDown(event,items,selected,onSelect,editable) {
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
            console.log("using the action", action)
            action(items, selected, onSelect, editable)
        }
    }


}

const am = new ActionManager()
am.registerActions({
    'list-nav-prev': (items,selected,onSelect,editable) => {
        const index = items.indexOf(selected)
        if(index > 0) onSelect(items[index-1])
    },
    'list-nav-next': (items,selected,onSelect,editable) => {
        const index = items.indexOf(selected)
        if(index < items.length -1) onSelect(items[index+1])
    },
    'list-nav-edit-item': (sel) => sel.startEditing(),
    'add-item-to-target-list': (sel) => {
        const list = sel.list
        const index = list.addItem()
        sel.selectByIndex(index)
        sel.startEditing()
    }
})

am.registerKeys([
    {
        action: 'list-nav-prev',
        key: 'ArrowUp'
    },
    {
        action: 'list-nav-prev',
        key: 'p',
        control: true
    },
    {
        action: 'list-nav-next',
        key: 'ArrowDown'
    },
    {
        action: 'list-nav-next',
        key: 'n',
        control: true
    },
    {
        action: 'list-nav-edit-item',
        key: 'Enter'
    },
    {
        action: 'add-item-to-target-list',
        key: 'N'
    },
    {
        action: 'change-project',
        key: 'M'
    },
    {
        action: 'change-do-date',
        key: 'S',
        alt: true
    },
    {
        action: 'toggle-completed',
        key: 'T'
    }
])

export const ShortcutsPanel = ({actionManager}) => {
    const am = actionManager
    return <ul className={'grow shortcuts'}>{am.getShortcuts().map((sc, i) => {
        return <li key={i}>{sc.name}
            <ul>{sc.keys.map((key, i)=>{
                return <li key={i}>{key.toString()}</li>
            })}</ul>
        </li>
    })}</ul>
}

export const AM = am
