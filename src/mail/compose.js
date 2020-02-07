import React from 'react'
import {useDraft} from '../common/storage2.js'
import {useActionScope} from '../common/actions.js'
import {HBox, VBox} from '../common/layout.js'

export function ComposingMailView({mail, done}) {
    const [draft, update, save] = useDraft(mail)
    const handlers = useActionScope('compose', {
        'send-mail': done
    })

    return <VBox className={'composing-mail-view'} onKeyDown={handlers.onKeyDown}>
        <HBox>
            <label>to</label>
            <input type="text" value={draft.receiver} className={'grow'}  onChange={(e)=>update('receiver',e.target.value)}/>
        </HBox>
        <HBox>
            <label>Subject</label>
            <input type="text" value={draft.subject} className='grow' onChange={(e)=>update('subject',e.target.value)}/>
        </HBox>
        <textarea className={'grow stretch'} value={draft.body} onChange={(e)=>update('body',e.target.value)}/>
        <HBox>
            <button onClick={done}>save for later</button>
            <button onClick={done}>send now</button>
        </HBox>
    </VBox>
}
