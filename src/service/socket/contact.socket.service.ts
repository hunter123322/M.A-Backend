import { Contact } from "../../model/contact/contact.list.model";
import { ConversationList } from "../../model/conversation/conversation.model";

export async function contactInit(userID: number) {
    try {
        const contactQuery = await Contact.findOne({ userID: userID });
        const contactList = contactQuery?.conversationID as string[];
        const contactListInfo = await ConversationList.find({_id: contactList});
        
        return contactListInfo;
    } catch (error: any) {
        console.log(`Error: ${error}`);
        throw new Error("Error initialize contact");
    }
}