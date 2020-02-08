import React, {useContext, useRef} from 'react'
import {FocusContext, HBox, useAutofocusRefWhenSelected, VBox} from '../common/layout.js'
import {useActionScope} from '../common/actions.js'

export function ReadingMailView({mail}) {
    const fm = useContext(FocusContext)
    const vbox = useRef()
    useAutofocusRefWhenSelected(vbox,true,'viewer')
    const handlers = useActionScope('list',{
        'focus-prev-master': () => {
            fm.setMasterFocus('mails')
        },
        'focus-next-master': () => {
        },
    })
    if (!mail) return <VBox className={'reading-mail-view'}
                            onKeyDown={handlers.onKeyDown}
    >no message selected</VBox>
    return <div className={'reading-mail-view panel'}
                onKeyDown={handlers.onKeyDown}
                tabIndex={0}
                ref={vbox}
                style={{
                    gridColumn:'3/4',
                    gridRow:'2/3',
                    overflow:'scroll',
                    display:'flex',
                    flexDirection:'column',
                    alignItems:'stretch',
                }}
    >
        <HBox className={'subject-line'}>
            <b>{mail.subject}</b>
        </HBox>
        <HBox className={'from-line'}>
            <b>from {mail.sender}</b>
        </HBox>
        <HBox className={'receiver-line'}>
            <b>to {mail.receiver}</b>
        </HBox>
        <HBox className={'timestamp-line'}>
            <b>{mail.timestamp}</b>
        </HBox>
        <HBox className={'body-line'}>{mail.body}</HBox>
    </div>
}
