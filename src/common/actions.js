import React, {createContext} from 'react'
import {useContext} from 'react'

export class ActionManager {
    constructor() {
        this.keysList = []
        this.actionsList = {}
        this._globalOnKeyDownHandler = (e) => {
            const binding = this.matchBinding(e,'global')
            if(binding) {
                if(this.actionsList[binding.action]) {
                    const action = this.actionsList[binding.action]
                    action()
                }
            }
        }
    }
    registerKeys(arr) {
        console.log(navigator.oscpu)
        let os = "none"
        if(navigator.oscpu.match(/win/i)) {
            os = 'windows'
        }
        console.log("os is",os)
        this.keysList = arr.map(binding => {
            binding.key = binding.key.toLowerCase()
            if(binding.key === 'period') binding.key = '.'
            return binding
        }).filter(binding => {
            if(!binding.os) return true
            if(binding.os.includes(os)) return true
            return false
        })
    }
    getShortcuts() {
        const map = {}
        this.keysList.forEach(binding => {
            if(!map[binding.action]) map[binding.action] = []
            let str = binding.key
            if(binding.control) str = 'ctrl+'+str
            if(binding.shift) str = 'shift+'+str
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
    matchBinding(event, scope) {
        // console.log(`scope ${scope} key ${event.key} alt=${event.altKey} shift=${event.shiftKey} ctrl=${event.ctrlKey}`)
        if(event.key === 'Control') return
        let binding = this.matchBindingScope(event,scope)
        if(!binding) binding = this.matchBindingScope(event,'global')
        return binding
    }
    globalOnKeyDownHandler() {
        return this._globalOnKeyDownHandler
    }
    registerAction(scope,name,fn) {
        this.actionsList[name] = fn
    }
    runAction(scope,name) {
        if(this.actionsList[name]) {
            const action = this.actionsList[name]
            action()
        } else {
            console.warn("missing action",name)
        }
    }

    matchBindingScope(event, scope) {
        const binding = this.keysList.find(binding=> {
            if(binding.shift && !event.shiftKey) return false
            if(binding.alt && !event.altKey) return false
            if(binding.control && !event.ctrlKey) return false
            if(binding.meta && !event.metaKey) return false
            if(event.ctrlKey && !binding.control) return false
            if(binding.key === event.key.toLowerCase()) {
                if(binding.scope.indexOf(scope)>=0) return true
                if(binding.scope === scope) return true
                return false
            }
            return false
        })
        return binding
    }
}

const am = new ActionManager()

export const ActionContext = createContext(am)

export const ShortcutsPanel = () => {
    const am = useContext(ActionContext)
    return <ul className={'grow shortcuts scroll'}>{am.getShortcuts().map((sc, i) => {
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
        onKeyDown: (e) => {
            // console.log("key target is",e.target, e.target.nodeName, e.key)
            //don't filter text input keys
            if(e.target.nodeName === 'INPUT'
                || e.target.nodeName === 'TEXTAREA'
            ) {
                //some keys are allowed
                if(e.key !== 'Escape') return
            }
            const binding = am.matchBinding(e,scope)
            // console.log("matched the binding",binding,'actions',actions)
            if(binding) {
                e.preventDefault()
                if(actions[binding.action]) {
                    actions[binding.action](e, am)
                    return
                }

                am.runAction(binding.scope,binding.action)
            }
        }
    }
}
