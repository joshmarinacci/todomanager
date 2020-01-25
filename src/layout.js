import React from 'react'

export const FillBox = ({children, className="", ...rest}) => {
    return <div className={"fillbox " + className} {...rest}>{children}</div>
}
export const HBox = ({children, className = "", ...rest}) => {
    return <div className={"hbox " + className} {...rest}>{children}</div>
}
export const VBox = ({children, className = "", ...rest}) => {
    return <div className={"vbox " + className} {...rest}>{children}</div>
}

