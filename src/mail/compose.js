import React, {useContext, useState} from 'react'
import {StorageContext, useQuery} from '../common/storage2.js'
import {useActionScope} from '../common/actions.js'
import {HBox, VBox} from '../common/layout.js'

export function ComposingMailView({mail, done}) {
    const storage = useContext(StorageContext)
    const [q] = useState(() => {
        return storage.createQuery('mails', (m) => m === mail)
    })
    const [realmailarray] = useQuery(q)

    const editedTo = (e) => storage.update('message',mail,'receiver', e.target.value)
    const editedSubject = (e) => storage.update('message',mail,'subject', e.target.value)
    const editedBody = (e) => storage.update('message',mail,'body', e.target.value)

    const handlers = useActionScope('compose', {
        'send-mail': done
    })

    return <VBox className={'composing-mail-view'} onKeyDown={handlers.onKeyDown}>
        <HBox>
            <label>to</label>
            <input type="text" value={mail.receiver} className={'grow'}
                   onChange={editedTo}/>
        </HBox>
        <HBox>
            <label>Subject</label>
            <input type="text" value={mail.subject} className='grow'
                   onChange={editedSubject}
            />
        </HBox>
        <textarea className={'grow stretch'} value={mail.body}
                  onChange={editedBody}
        />
        <HBox>
            <button onClick={done}>save for later</button>
            <button onClick={done}>send now</button>
        </HBox>
    </VBox>
}
