import React, {createContext, useContext, useEffect, useRef, useState} from 'react'
import {useQuery} from './storage.js'
import {useActionScope} from './actions.js'

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
    }
    return <div style={style} className={css}>{content}</div>
}


export class FocusManager {
    constructor() {
        this.listeners = []
    }
    on(cb) {
        this.listeners.push(cb)
    }
    off(cb) {
        this.listeners = this.listeners.filter(c => c !== cb)
    }
    setMasterFocus(mf) {
        console.log('set focus master to',mf)
        this.mf = mf
        this.listeners.forEach(cb=>cb())
    }
    getMasterFocus() {
        return this.mf
    }
}
export const FocusContext = createContext()



function GenericListItemView({
                                 item,
                                 selectedItem,
                                 setSelectedItem,
                                 ItemTemplate,
                                 ItemClassName,
                                 ItemProps,
                                 focusName,
                             }) {

    const isSelected = item === selectedItem
    const cname = makeClassNames({
        selected: isSelected,
        'generic-list-item': true,
        [ItemClassName]:true,
    })
    const hbox = useRef()
    const fm = useContext(FocusContext)
    useEffect(() => {
        const check = () => {
            if (hbox.current && item === selectedItem && fm.getMasterFocus() === focusName) {
                hbox.current.focus()
            }
        }
        check()
        fm.on(check)
        return ()=>fm.off(check)
    })

    return <div
        ref={hbox}
        className={cname}
        onClick={() => {
            setSelectedItem(item)
            fm.setMasterFocus(focusName)
        }}
        tabIndex={0}
    >
        <ItemTemplate item={item} {...ItemProps}/>
    </div>
}

export function GenericListView({
                             className,
                             style,
                             query,
                             ItemTemplate,
                             selectedItem,
                             setSelectedItem,
                             ItemClassName,
    ItemProps,
    actionHandlers,
    focusName,
                         }) {
    const [data] = useQuery(query)
    const css = makeClassNames({
        'generic-list-view': true
    })
    const handlers = useActionScope('list', {
        'move-selection-prev': () => {
            const index = data.indexOf(selectedItem)
            if (index > 0) {
                setSelectedItem(data[index - 1])
            }
        },
        'move-selection-next': () => {
            const index = data.indexOf(selectedItem)
            if (index < data.length - 1) {
                setSelectedItem(data[index + 1])
            }
        },
        ...actionHandlers
    })
    return <div className={'scroll-wrapper'} style={style}>
        <div className={css + " " + className} onKeyDown={handlers.onKeyDown}>
            {data.map((item, i) => {
                return <GenericListItemView
                    key={i}
                    item={item}
                    setSelectedItem={setSelectedItem}
                    ItemTemplate={ItemTemplate}
                    ItemClassName={ItemClassName}
                    ItemProps={ItemProps}
                    selectedItem={selectedItem}
                    focusName={focusName}
                />
            })}
        </div>
    </div>
}

