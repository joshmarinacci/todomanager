import {Archive, FileText, Folder, Inbox, Trash2} from 'react-feather'
import React, {useContext, useEffect, useState} from 'react'
import {StorageContext, useQuery} from '../common/storage2.js'
import {CSS, FocusContext, GenericListView, makeClassNames, PopupContext, VBox} from '../common/layout.js'
import {useActionScope} from '../common/actions.js'

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
        <b>{item.title}</b>
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
    const [q, setQ] = useState(() => {
        return storage.createQuery({table:'message', find:(m) => !m.deleted && !m.archived && m.folder === 'inbox'})
    })
    useEffect(() => {
        if (selectedFolder) {
            if (selectedFolder.title === 'trash') {
                return setQ(storage.createQuery({table:'message', find:m => m.deleted === true}))
            }
            if (selectedFolder.title === 'archived') {
                return setQ(storage.createQuery({table:'message', find:m => m.archived === true}))
            }
            if (selectedFolder.title === 'all') {
                return setQ(storage.createQuery({table:'message', find:m => true}))
            }
            setQ(storage.createQuery({table:'message', find:m => (m.folder === selectedFolder.title
                && !m.deleted
                && !m.archived
            )}))
        }
    }, [selectedFolder])
    const pm = useContext(PopupContext)
    const fm = useContext(FocusContext)
    const handlers = useActionScope('list',{
        'delete-selected-emails': () => {
            storage.updateObject('message',selectedMail,'deleted',true)
        },
        'archive-selected-emails': () => {
            storage.updateObject('message',selectedMail,'archived', true)
        },
        'move-selected-emails': (e) => {
            fm.pushMasterFocus('popup')
            pm.show(e.target, <MoveMailPopup mail={selectedMail}/>)
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

function PopupFolderItem({item, moveMail}) {
    return <span onClick={moveMail}>{item.title}</span>
}
function MoveMailPopup({mail}) {
    const storage = useContext(StorageContext)
    const [q] = useState(() => storage.createQuery('folders', f => !f.special))
    const [folders] = useQuery(q)
    const [selFolder, setSelFolder] = useState(folders[0])
    const pm = useContext(PopupContext)
    const fm = useContext(FocusContext)
    const handlers = useActionScope('list',{
        'move-mail':()=>{
            console.log('moving',mail,'to',selFolder)
            fm.popMasterFocus()
            pm.hide()
        },
        'exit':()=>{
            console.log("exiting")
            fm.popMasterFocus()
            pm.hide()
        },
    })

    return <div className={"move-mail-popup-wrapper"} onKeyDown={handlers.onKeyDown}>
        <GenericListView
            query={q}
            ItemTemplate={PopupFolderItem}
            selectedItem={selFolder}
            setSelectedItem={setSelFolder}
            focusName={'popup'}
            ItemProps={{
                moveMail:()=>{
                    console.log("clicked")
                    console.log('moving',mail,'to',selFolder)
                    fm.popMasterFocus()
                    pm.hide()
                }
            }}
        />
    </div>
}

function MailItemView({item}) {
    const mail = item
    const storage = useContext(StorageContext)
    //const [setProp] = useObjectUpdate(storage, 'mails', mail)
    let css = CSS({
        mail: true,
        hbox: true,
        deleted: mail.deleted,
        read: mail.read
    })
    const fm = useContext(FocusContext)
    const clickedMail = () => {
        console.log("clicked on a mail")
        storage.updateObject('message',item,'read',true)
        fm.setMasterFocus('mails')
    }
    return <div className={css} onClick={clickedMail}>
        <VBox className={'grow'}>
            <b className={'sender'}>{mail.sender}</b>
            <b className={'subject'}>{mail.subject}</b>
        </VBox>
        <b className={'timestamp'}>{new Date(mail.timestamp).toLocaleTimeString()}</b>
    </div>
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp)
    return date.toTimeString()
}

