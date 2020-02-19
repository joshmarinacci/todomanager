import {ActionContext, ActionManager, useActionScope} from '../common/actions.js'
import React, {useContext, useState} from 'react'
import {
    PopupContainer,
    Spacer,
    Toolbar
} from '../common/layout.js'
import {
    AlertOctagon,
    Archive,
    ArrowRight,
    CornerUpLeft,
    FileText,
    Layout,
    Trash2
} from "react-feather"
import "./mail.css"
import {StorageContext, Storage} from '../common/storage2.js'
import {ReadingMailView} from './read.js'
import {ComposingMailView} from './compose.js'
import {FoldersListView, MailsListView} from './folders.js'
import {generateFakeEmail, makeNewMail, makeReplyMail} from './actions.js'

const storage = new Storage()
const FOLDER = storage.defineTable({
    name:'folder',
    schema: {
        title: {
            type:String,
            required:true,
        },
        special: {
            type:Boolean,
            default:false,
        },
    },
})
const MESSAGE = storage.defineTable({
    name:'message',
    schema: {
        sender: String,
        receiver:String,
        subject:String,
        body:String,
        deleted:Boolean,
        folder:FOLDER,
        timestamp:Date,
        read:Boolean,
        archived:Boolean,
    }
})

function makeInitialData() {
    storage.makeObject('folder', {title: 'inbox', special: true})
    storage.makeObject('folder', {title: 'drafts', special: true})
    storage.makeObject('folder', {title:'readme', special:false})
    storage.makeObject('folder', {title:'orders', special:false})
    storage.makeObject('folder', {title: 'trash', special: true})
    storage.makeObject('folder', {title: 'all', special: true})

    function makeMail(sender, subject, body) {
        storage.makeObject("message", {
            sender: sender,
            receiver: 'Josh Marinacci',
            subject: subject,
            body: body,
            deleted: false,
            folder: 'inbox',
            timestamp: Date.now(),
            read: false,
            archived: false
        })
    }

    makeMail('github',
        '[MozillaReality/FirefoxReality] Fixes #2706 Remove dialog from stack',
        `Remove dialog from stack when released`)
    makeMail('Lego Ideas',
        'Weekly Digest',
        `Here's whats's happening on LEGO ideas `)
}
storage.init('email',makeInitialData).then(()=>{
    console.log("mail storage is loaded")
})

export const MailApp = () => {
    const am = new ActionManager()
    am.registerKeys([
        //list scope
        {action: 'delete-selected-emails', key: 'backspace', scope: 'list'},
        {action: 'move-selection-prev', key: 'ArrowUp', scope: 'list'},
        {action: 'move-selection-prev', key: 'k', scope: 'list'},
        {action: 'move-selection-next', key: 'ArrowDown', scope: 'list'},
        {action: 'move-selection-next', key: 'j', scope: 'list'},
        {action: 'focus-prev-master',  key:'ArrowLeft',  scope:'list'  },
        {action: 'focus-next-master',  key:'ArrowRight',  scope:'list'  },
        {action: 'archive-selected-emails', key: 'a', scope: 'list'},
        {action: 'reply', key: 'r', scope: 'list'},
        {action: 'move-selected-emails', key: 'm', scope: 'list'},

        //compose scope
        {action: 'send-mail', scope: 'compose', key: 'd', alt: true},
        //global scope
        {action: 'compose-new-mail', scope: 'global', key: 'n', alt: true},
        {action: 'reply', scope: 'global', key: 'r', alt: true},

        // popup-list scope
        // popup-list scope
        {action: 'exit-menu-item', scope: 'list', key: 'escape'},
        {action: 'select-menu-item', scope:'list', key:'enter'},
    ])
    return <ActionContext.Provider value={am}>
        <StorageContext.Provider value={storage}>
            <MailAppContent/>
        </StorageContext.Provider>
    </ActionContext.Provider>
}

const MailAppContent = () => {
    const storage = useContext(StorageContext)
    const [mail, setMail] = useState(null)
    const [folder, setFolder] = useState(null)
    const [composing, setComposing] = useState(false)
    const composeNewEmail = () => {
        setComposing(true)
        makeNewMail(storage).then(newMail => setMail(newMail))
    }
    const reply = () => {
        setComposing(true)
        makeReplyMail(storage,mail).then(newMail => setMail(newMail))
    }

    const handlers = useActionScope('global', {
        'compose-new-mail': composeNewEmail,
        'reply': reply
    })
    return <div onKeyDown={handlers.onKeyDown} className={'mailapp-grid grow'}>
        <Toolbar className={'grid-toolbar'}>
            {/*<SearchBox searching={searching} setSearching={endSearching} setQuery={setQuery}/>*/}
            <button onClick={reply}><CornerUpLeft/>Reply</button>
            <button onClick={composeNewEmail}><FileText/> New Mail</button>
            <button><ArrowRight/> Forward</button>
            <button><Archive/> Archive</button>
            <button><Trash2/> Delete</button>
            <Spacer/>
            <button><Layout/></button>
            <button onClick={()=>generateFakeEmail(storage)}><AlertOctagon/> fake</button>
        </Toolbar>
        <FoldersListView selectedFolder={folder} setFolder={setFolder}/>
        <MailsListView setMail={setMail} selectedMail={mail} selectedFolder={folder}/>
        {composing ? <ComposingMailView mail={mail} done={() => setComposing(false)}/> : <ReadingMailView mail={mail}/>}
            <PopupContainer/>
    </div>
}




