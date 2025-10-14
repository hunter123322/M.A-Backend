export type Participant = {
    userID: number,
    firstName: string,
    lastName: string,
    nickname: string,
    mute: boolean
}

export type Conversation = {
    userID: number,
    participant: Array<Participant>,
    contactID: string,
    _id?: boolean
}
