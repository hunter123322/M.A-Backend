import { test, describe, expect, mock, beforeEach } from "bun:test";
import { postSignup } from "./signup.controller"; // adjust path

// ---- Mocks ----
const mockSignController = mock();

mock.module("../../user.controller.js", () => ({
    UserController: class {
        signController = mockSignController;
    },
}));

describe("postSignup", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        mockSignController.mockReset();
        console.error = mock();

        req = {
            body: { email: "testuser", password: "pass123" },
            session: {},
        };

        res = {
            status: mock().mockReturnThis(),
            json: mock(),
        };
    });


    test("should signup successfully and return user_id", async () => {
        mockSignController.mockResolvedValueOnce(42);

        await postSignup(req, res);

        expect(mockSignController).toHaveBeenCalledWith("testuser", "pass123");
        expect(req.session.user_id).toBe(42);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: "aceepted", user_id: 42 });
    });

    test("should return 500 if UserController throws error", async () => {
        mockSignController.mockRejectedValueOnce(new Error("DB error"));

        await postSignup(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
    });

    test("should return 500 if request body is empty", async () => {
        req.body = null;

        await postSignup(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Try it again" });
    });
});
