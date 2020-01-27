import React, {useState} from 'react'

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
