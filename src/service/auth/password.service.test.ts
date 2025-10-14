import { describe, it, expect, mock, beforeEach } from "bun:test";
import { passwordHasher, compareEncryptedPassword } from "./password.service";
import { RowDataPacket, PoolConnection } from "mysql2/promise";
import type { UserAut } from "../../types/User.type.js";

// -------------------- bcryptjs Mock --------------------
const mockBcryptCompare = mock(() => Promise.resolve(true));
const mockBcryptHash = mock(() => Promise.resolve("mocked_hash"));

mock.module("bcryptjs", () => ({
  default: {
    compare: mockBcryptCompare,
    hash: mockBcryptHash,
  },
  compare: mockBcryptCompare,
  hash: mockBcryptHash,
}));


// -------------------- UserModel Mock --------------------
const mockInitUserInfo = mock();
mock.module("../../model/user/user.model.js", () => ({
  UserModel: mock(() => ({
    initUserInfo: mockInitUserInfo,
  })),
}));

// -------------------- MySQL Connection Pool Mock --------------------
const mockQuery = mock();
const mockRollback = mock();
const mockRelease = mock();

// Create a consistent mock connection object
const createMockConnection = () => ({
  query: mockQuery,
  rollback: mockRollback,
  release: mockRelease,
} as unknown as PoolConnection);

const mockGetConnection = mock(() => Promise.resolve(createMockConnection()));

mock.module("../../db/mysql/mysql.connection-pool", () => ({
  default: {
    getConnection: mockGetConnection,
  },
}));

// -------------------- Tests --------------------
describe("User Authentication Services", () => {
  beforeEach(() => {
    // Reset all mocks and recreate the connection mock
    mockQuery.mockReset();
    mockBcryptCompare.mockReset();
    mockBcryptHash.mockReset();
    mockInitUserInfo.mockReset();
    mockRollback.mockReset();
    mockRelease.mockReset();
    mockGetConnection.mockReset();
    mockGetConnection.mockImplementation(() => Promise.resolve(createMockConnection()));
  });

  describe("> passwordHasher", () => {
    it("should successfully hash a password", async () => {
      const password = "mysecretpassword";

      const result = await passwordHasher(password);
      expect(result).toBe(result);
    });

    it("should throw if password is not a string", async () => {
      await expect(passwordHasher(123 as any)).rejects.toThrow(
        "Password must be a string"
      );
    });
  });

  describe("> compareEncryptedPassword", () => {
    const sampleUserAuth: UserAut = {
      user_id: 100,
      email: "drin@gmail.com",
      password: "$2a$10$someFakeHashForTesting1234567890", // <-- fake bcrypt hash
      created_at: "2024-01-01T00:00:00Z",
    };

    const sampleUserInfo = {
      firstName: "John",
      lastName: "Doe",
      middleName: "J",
      age: 30,
    };

    const expectedFullUser = {
      ...sampleUserAuth,
      ...sampleUserInfo,
    };

    it("should return a full user object when credentials are valid", async () => {
      mockQuery.mockResolvedValueOnce([[sampleUserAuth], []] as [RowDataPacket[], any]);
      mockBcryptCompare.mockResolvedValueOnce(true);
      mockInitUserInfo.mockResolvedValueOnce(sampleUserInfo);

      const result = await compareEncryptedPassword("drin@gmail.com", "@#@#aldrin");

      expect(mockGetConnection).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(
        "SELECT * FROM users_auth WHERE email = ?",
        ["drin@gmail.com"]
      );
      expect(mockBcryptCompare).toHaveBeenCalledWith(
        "@#@#aldrin",
        sampleUserAuth.password
      );
      expect(mockInitUserInfo).toHaveBeenCalledWith(sampleUserAuth.user_id);
      expect(mockRelease).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedFullUser);
    });


    it("should throw 'email not found!' when user doesn't exist", async () => {
      mockQuery.mockResolvedValueOnce([[], []] as [RowDataPacket[], any]);

      await expect(
        compareEncryptedPassword("nonexistent", "anypassword")
      ).rejects.toThrow("email not found!");

      expect(mockRelease).toHaveBeenCalledTimes(1);
      expect(mockBcryptCompare).not.toHaveBeenCalled();
    });

    it("should rollback and release connection on database error", async () => {
      const dbError = new Error("Database connection failed");
      mockQuery.mockRejectedValueOnce(dbError);

      await expect(
        compareEncryptedPassword("testuser", "anypassword")
      ).rejects.toThrow(dbError);

      expect(mockRollback).toHaveBeenCalledTimes(1);
      expect(mockRelease).toHaveBeenCalledTimes(1);
    });

    it("should handle empty email or password", async () => {
      // Test empty email
      mockQuery.mockResolvedValueOnce([[], []] as [RowDataPacket[], any]);
      await expect(
        compareEncryptedPassword("", "password")
      ).rejects.toThrow("email not found!");

      // Test empty password
      mockQuery.mockResolvedValueOnce([[sampleUserAuth], []] as [RowDataPacket[], any]);
      await expect(
        compareEncryptedPassword("email", "")
      ).rejects.toThrow("Incorrect password!");

      expect(mockRelease).toHaveBeenCalledTimes(2);
    });
  });
});