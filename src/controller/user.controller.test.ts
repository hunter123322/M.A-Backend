// import { test, describe, expect, mock, beforeEach } from "bun:test";
// import { UserAuthFull, UserController } from "./user.controller"; // adjust path

// // ---- Mock dependencies ----
// const mockPasswordHasher = mock();
// const mockCompareEncryptedPassword = mock();
// const mockSignupCredential = mock();
// const mockInformationCredential = mock();
// const mockLocationCredential = mock();
// const mockInitMessage = mock();
// const mockUserValidation = mock();
// const mockLocationValidation = mock();

// mock.module("../service/auth/password.service", () => ({
//   default: {
//     passwordHasher: mockPasswordHasher,
//     compareEncryptedPassword: mockCompareEncryptedPassword,
//   },
// }));

// mock.module("../service/user/user.service", () => ({
//   UserTransaction: class {
//     signupCredential = mockSignupCredential;
//     informationCredential = mockInformationCredential;
//     locationCredential = mockLocationCredential;
//   },
// }));

// mock.module("../validation/user.signup.validation", () => ({
//   default: {
//     userValidation: mockUserValidation,
//     locationValidation: mockLocationValidation,
//   },
// }));

// mock.module("../model/user/user.model", () => ({
//   UserModel: class {
//     initMessage = mockInitMessage;
//   },
// }));

// describe("UserController", () => {
//   let userController: UserController;

//   beforeEach(() => {
//     // Reset all mocks before each test
//     mockPasswordHasher.mockReset();
//     mockCompareEncryptedPassword.mockReset();
//     mockSignupCredential.mockReset();
//     mockInformationCredential.mockReset();
//     mockLocationCredential.mockReset();
//     mockInitMessage.mockReset();
//     mockUserValidation.mockReset();
//     mockLocationValidation.mockReset();

//     userController = new UserController({} as any);
//   });

//   test("signController should hash password and call signupCredential", async () => {
//     mockPasswordHasher.mockResolvedValueOnce("hashedPass");
//     mockSignupCredential.mockResolvedValueOnce(42);

//     const user_id = await userController.signController("user", "pass123");
//     expect(mockPasswordHasher).toHaveBeenCalledWith("pass123");
//     expect(mockSignupCredential).toHaveBeenCalledWith("user", "hashedPass");
//     expect(user_id).toBe(42);
//   });

//   test("userInformationController should validate and call informationCredential", async () => {
//     const info = { firstName: "A", lastName: "B", middleName: "C", age: 20 };
//     mockUserValidation.mockReturnValueOnce(true);
//     await userController.userInformationController(info, 42);
//     expect(mockInformationCredential).toHaveBeenCalledWith(info, 42);
//   });

//   test("userInformationController should throw if validation fails", async () => {
//     const info = { firstName: "A", lastName: "B", middleName: "C", age: 20 };
//     mockUserValidation.mockReturnValueOnce(false);
//     await expect(userController.userInformationController(info, 42))
//       .rejects.toThrow();
//   });

//   test("locationController should validate and call locationCredential", async () => {
//     const loc = {
//       country: "PH",
//       region: "Bicol",
//       district: "Albay",
//       municipality: "Bacacay",
//       barangay: "4",
//       zone: "1",
//       house_number: "123",
//     };
//     mockLocationValidation.mockReturnValueOnce(true);
//     await userController.locationController(loc, 42);
//     expect(mockLocationCredential).toHaveBeenCalledWith(loc, 42);
//   });

//   test("locationController should throw if validation fails", async () => {
//     const loc = {
//       country: "PH",
//       region: "Bicol",
//       district: "Albay",
//       municipality: "Bacacay",
//       barangay: "4",
//       zone: "1",
//       house_number: "123",
//     };
//     mockLocationValidation.mockReturnValueOnce(false);
//     await expect(userController.locationController(loc, 42))
//       .rejects.toThrow();
//   });

//   test("loginController should return ApiResponse on valid login", async () => {
//     const authData = { email: "drin@gmail.com", password: "@#@#aldrin" };

//     const fakeAuth: UserAuthFull = {
//       created_at: "2025-08-19T12:00:00Z",
//       user_id: 1,
//       email: "drin@gmail.com",
//       password: "securePass123",
//       firstName: "John",
//       lastName: "Doe",
//       middleName: "Michael",
//       age: 30,
//     };

//     const messages = [{ content: "hi" } as any];

//     mockCompareEncryptedPassword.mockResolvedValueOnce(fakeAuth);
//     mockInitMessage.mockResolvedValueOnce(messages);

//     const response = await userController.loginController(authData);
//     console.log(response);

//     expect(mockCompareEncryptedPassword).toHaveBeenCalledWith("drin@gmail.com", "@#@#aldrin");
//     expect(mockInitMessage).toHaveBeenCalledWith(1);
//     expect(response).toEqual({
//       user_id: 1,
//       messages,
//       authentication: fakeAuth,
//     });
//   });


//   test("loginController should throw if authentication fails", async () => {
//     const authData = { email: "user", password: "wrongpass" };
//     mockCompareEncryptedPassword.mockResolvedValueOnce(null);
//     await expect(userController.loginController(authData)).rejects.toThrow("Invalid Login!");
//   });
// });
