import { Request, Response } from "express"

type DeleteContactQuery = {

}

export async function deleteContact(req: Request, res: Response) {
    try {
        const query = req.query as any;
        const user_id = (req.session as { user_id?: number }).user_id;

        if (!query) {
            console.log("Empty query");
            throw new Error("Try Again");
        }

               
    } catch (error) {


    }
}