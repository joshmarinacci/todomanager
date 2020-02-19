import {Archive, FileText, Folder, Inbox, Trash2} from 'react-feather'
import React, {useContext, useEffect, useState} from 'react'
import {StorageContext} from '../common/storage2.js'
import {CSS, FocusContext, GenericListView, ListViewPopup, PopupContext, VBox} from '../common/layout.js'
import {useActionScope} from '../common/actions.js'
import {archiveEmail, deleteEmail, moveMail, queryForFolder} from './actions.js'

function FolderIcon({folder}) {
    if (folder.title === 'inbox') return <Inbox/>
    if (folder.title === 'trash') return <Trash2/>
    if (folder.title === 'drafts') return <FileText/>
    if (folder.title === 'all') return <Archive/>

    return <Folder/>
}

function FolderItemView({item}) {
    return <>
        <FolderIcon folder={item}/>
        <span style={{padding:'0.5rem'}}></span>
        <span>{item.title}</span>
    </>
}

export function FoldersListView({selectedFolder, setFolder}) {
    const storage = useContext(StorageContext)
    const [afq] = useState(() => storage.createQuery({table:'folder',find: f => true}))
    const fm = useContext(FocusContext)
    const handlers = useActionScope('list', {
        'focus-prev-master': () => {
        },
        'focus-next-master': () => {
            fm.setMasterFocus('mails')
        },
    })
    return <div onKeyDown={handlers.onKeyDown} className={"panel"} style={{
        gridColumn: '1/2',
        gridRow:'2/3',
        display:'flex',
        flexDirection:'column',
        overflowY:'scroll'
    }}>
        <GenericListView
            className={'folders-list-view'}
            ItemTemplate={FolderItemView}
            selectedItem={selectedFolder}
            setSelectedItem={setFolder}
            focusName={'folders'}
            query={afq}
        />
    </div>
}

export function MailsListView({setMail, selectedMail, selectedFolder}) {
    const storage = useContext(StorageContext)
    const [q, setQ] = useState(() => queryForFolder(storage,null))
    useEffect(() => setQ(queryForFolder(storage,selectedFolder)), [selectedFolder])
    const pm = useContext(PopupContext)
    const fm = useContext(FocusContext)
    const handlers = useActionScope('list',{
        'delete-selected-emails': () => deleteEmail(storage,selectedMail),
        'archive-selected-emails': () => archiveEmail(storage,selectedMail),
        'move-selected-emails': (e) => {
            fm.pushMasterFocus('popup')
            const q = storage.createQuery({table:'folder', find:f => !f.special})
            const onAction = (selFolder)=> moveMail(storage,selectedMail,selFolder)
            pm.show(e.target, <ListViewPopup query={q} ItemTemplate={PopupFolderItem} onAction={onAction}/>)
        },
        'reply': () => {
            console.log("replying to this mail")
        },
        'focus-prev-master': () => {
            fm.setMasterFocus('folders')
        },
        'focus-next-master': () => {
            fm.setMasterFocus('viewer')
        },
    })
    return <div onKeyDown={handlers.onKeyDown} className={'panel'} style={{
        gridColumn:'2/3',
        gridRow:'2/3',
        display:'flex',
        flexDirection:'column',
        overflowY:'auto',
        alignItems:'stretch',
    }}>
        <GenericListView
            className={"mails-list-view"}
            ItemTemplate={MailItemView}
            ItemClassName={"mails-item-view"}
            selectedItem={selectedMail}
            setSelectedItem={setMail}
            focusName={'mails'}
            query={q}
        />
    </div>
}

function PopupFolderItem({item}) {
    return <span>{item.title}</span>
}

function MailItemView({item}) {
    const mail = item
    const storage = useContext(StorageContext)
    //const [setProp] = useObjectUpdate(storage, 'mails', mail)
    let css = CSS({
        mail: true,
        hbox: true,
        deleted: mail.deleted,
        read: mail.read,
        grow:true,
    })
    const fm = useContext(FocusContext)
    const clickedMail = () => {
        console.log("clicked on a mail")
        storage.updateObject('message',item,'read',true)
        fm.setMasterFocus('mails')
    }
    return <div className={css} onClick={clickedMail}>
        <VBox className={'grow'}>
            <span className={'sender'}>{mail.sender}</span>
            <span className={'subject'}>{mail.subject}</span>
        </VBox>
        <span className={'timestamp'}>{new Date(mail.timestamp).toLocaleTimeString()}</span>
    </div>
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp)
    return date.toTimeString()
}

