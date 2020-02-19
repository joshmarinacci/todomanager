import * as faker from 'faker'

export function deleteEmail(storage,mail) {
    storage.updateObject('message',mail,'deleted',true)
}
export function archiveEmail(storage,mail) {
    storage.updateObject('message',mail,'archived', true)
}

export function queryForFolder(storage, folder) {
    if(!folder) {
        return storage.createQuery({table:'message', find:(m) => !m.deleted && !m.archived && m.folder === 'inbox'})
    }
    if(folder.title === 'inbox') {
        return storage.createQuery({table:'message', find:(m) => !m.deleted && !m.archived && m.folder === 'inbox'})
    }
    if (folder.title === 'trash') {
        return storage.createQuery({table:'message', find:m => m.deleted === true})
    }
    if (folder.title === 'archived') {
        return storage.createQuery({table:'message', find:m => m.archived === true})
    }
    if (folder.title === 'all') {
        return storage.createQuery({table:'message', find:m => true})
    }
    return storage.createQuery({table:'message', find:m => (m.folder === folder.title  && !m.deleted  && !m.archived)})
}

export function moveMail(storage,mail,folder) {
    storage.updateObject('message',mail,'folder',folder.title)
}

export const makeNewMail = (storage)=>{
    return storage.makeObject('message', {
        sender: 'Josh Marinacci',
        receiver: 'no one',
        subject: '',
        body: '',
        deleted: false,
        archived: false,
        read: false,
        folder: 'drafts',
        timestamp: Date.now()
    })
}
export const generateFakeEmail = (storage) => {
    return storage.makeObject('message', {
        sender: faker.name.firstName(),
        receiver: 'Josh Marinacci',
        subject: faker.random.words(3),
        body: faker.lorem.paragraphs(20),
        deleted: false,
        folder: 'inbox',
        timestamp: faker.date.recent().getTime(),
        read: false,
        archived: false
    })
}

export const makeReplyMail = (storage, mail) => {
    return storage.makeObject('message', {
        sender: 'Josh Marinacci',
        receiver: mail.sender,
        subject: `Re: ${mail.subject}`,
        body: mail.body,
        deleted: false,
        archived: false,
        read: false,
        folder: 'drafts',
        timestamp: Date.now()
    })
}
