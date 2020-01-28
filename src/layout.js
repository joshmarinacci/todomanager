import React, {createContext, useContext, useEffect, useState} from 'react'

export const FillBox = ({children, className="", ...rest}) => {
    return <div className={"fillbox " + className} {...rest}>{children}</div>
}
export const HBox = ({children, className = "", ...rest}) => {
    return <div className={"hbox " + className} {...rest}>{children}</div>
}
export const VBox = ({children, className = "", ...rest}) => {
    return <div className={"vbox " + className} {...rest}>{children}</div>
}
export const Spacer = () => <span className="grow"/>
export const Toolbar = ({children, className = "", ...rest}) => {
    return <div className={"toolbar " + className} {...rest}>{children}</div>
}


export function makeClassNames(map) {
    let classNames = ""
    Object.keys(map).forEach(key=>{
        if(map[key]) classNames+= (" " + key)
    })
    return classNames
}

export const PopupButton = ({children, getItems, itemSelected, stringify})=>{
    const [open,setOpen] = useState(false)
    const toggleOpen = () => setOpen(!open)
    const button = <button onClick={toggleOpen}>{children} <b>\/</b></button>
    const clickItem = (item) => {
        toggleOpen()
        itemSelected(item)
    }
    let popup = ""
    if(open) {
        const items = getItems()
        popup = <ul className={"popup-wrapper"}>
            {items.map((item, i) => <li key={i} onClick={() => clickItem(item)}>{stringify(item)}</li>)}
        </ul>
    }

    return <div className={"popup-button-wrapper"}>{button}{popup}</div>
}


export class PopupManager {
    constructor() {
        this.visible = false
        this.listeners = []
    }
    on(cb) {
        this.listeners.push(cb)
    }
    off(cb) {
        this.listeners = this.listeners.filter(c => c !== cb)
    }
    show(target,content) {
        this.visible = true
        this.target = target
        this.content = content
        this.listeners.forEach(cb => cb(this))
    }
    hide() {
        this.target = null
        this.content = null
        this.visible = false
        this.listeners.forEach(cb => cb(this))
    }
}

export const PopupContext = createContext()

export function PopupContainer(){
    const pm = useContext(PopupContext)
    const [visible,setVisible] = useState(false)
    const [content,setContent] = useState(<b>nothing</b>)
    const [domTarget, setDomTarget] = useState(null)
    useEffect(()=>{
        const h = (pm) => {
            console.log("pm. should we show?",pm.visible)
            setVisible(pm.visible)
            setContent(pm.content)
            setDomTarget(pm.target)
        }
        pm.on(h)
        return ()=>pm.off(h)
    },[pm.visible])
    const css = makeClassNames({
        'popup-container':true,
        visible:visible
    })
    const style = {
        top:30,
        left:100,
    }
    if(visible && domTarget) {
        const bounds = domTarget.getBoundingClientRect()
        style.top = bounds.bottom
        style.left = bounds.left
        console.log(bounds)

    }
    return <div style={style} className={css}>for the popups {content} </div>
}
