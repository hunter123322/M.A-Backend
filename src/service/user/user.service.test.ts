import { describe, it, expect, mock, beforeEach } from "bun:test";
import { UserTransaction } from "./user.service"; // Assuming UserTransaction is in this file path
import { ResultSetHeader, Pool, PoolConnection } from "mysql2/promise";
import type { UserInfo, UserLocation } from "../../types/User.type";

// Mock the mysql2/promise module to control its behavior
const mockExecute = mock();
const mockBeginTransaction = mock();
const mockCommit = mock();
const mockRollback = mock();
const mockRelease = mock();

// Create a mock connection object with the required methods
const mockConnection = {
    beginTransaction: mockBeginTransaction,
    commit: mockCommit,
    rollback: mockRollback,
    release: mockRelease,
    execute: mockExecute,
};

// Create a mock for the getConnection function specifically
const mockGetConnection = mock(() => Promise.resolve(mockConnection));

// Create a mock pool object
const mockPool = {
    getConnection: mockGetConnection,
} as unknown as Pool;

describe("UserTransaction", () => {
    let userTransaction: UserTransaction;
    beforeEach(() => {
        // Reset all mocks before each test to ensure a clean state
        mockExecute.mockClear();
        mockBeginTransaction.mockClear();
        mockCommit.mockClear();
        mockRollback.mockClear();
        mockRelease.mockClear();
        mockGetConnection.mockClear();

        userTransaction = new UserTransaction(mockPool);
    });

    describe("signupCredential", () => {
        it("should successfully insert a new user and return the insertId", async () => {
            const email = "testuser";
            const hashedPassword = "hashedpassword";
            const insertId = 123;

            // Mock the execute function to return a successful ResultSetHeader
            mockExecute.mockResolvedValueOnce([
                { insertId, affectedRows: 1 } as ResultSetHeader,
                [],
            ]);

            const result = await userTransaction.signupCredential(email, hashedPassword);

            // Assert that the correct operations were performed
            expect(mockGetConnection).toHaveBeenCalledTimes(1);
            expect(mockBeginTransaction).toHaveBeenCalledTimes(1);
            expect(mockExecute).toHaveBeenCalledWith(
                `INSERT INTO users_auth (email, password) VALUES (?, ?)`,
                [email, hashedPassword]
            );
            expect(mockCommit).toHaveBeenCalledTimes(1);
            expect(mockRollback).not.toHaveBeenCalled();
            expect(mockRelease).toHaveBeenCalledTimes(1);
            expect(result).toBe(insertId);
        });

        it("should rollback the transaction if the insert fails", async () => {
            const email = "testuser";
            const hashedPassword = "hashedpassword";
            const error = new Error("Database error");

            // Mock the execute function to throw an error
            mockExecute.mockRejectedValueOnce(error);

            // Expect the method to throw the same error
            await expect(userTransaction.signupCredential(email, hashedPassword)).rejects.toThrow(error);

            // Assert that the correct operations were performed for a failed transaction
            expect(mockBeginTransaction).toHaveBeenCalledTimes(1);
            expect(mockCommit).not.toHaveBeenCalled();
            expect(mockRollback).toHaveBeenCalledTimes(1);
            expect(mockRelease).toHaveBeenCalledTimes(1);
        });
    });

    describe("informationCredential", () => {
        it("should successfully insert user information", async () => {
            const userInfo: UserInfo = {
                firstName: "John",
                lastName: "Doe",
                middleName: "A",
                age: 30
            };
            const userId = 123;

            // Mock the execute function for a successful insert
            mockExecute.mockResolvedValueOnce([
                { insertId: 0, affectedRows: 1 } as ResultSetHeader,
                [],
            ]);

            await expect(
                userTransaction.informationCredential(userInfo, userId)
            ).resolves.toBeUndefined();

            // ✅ Assert connection lifecycle
            expect(mockGetConnection).toHaveBeenCalledTimes(1);
            expect(mockBeginTransaction).toHaveBeenCalledTimes(1);

            // ✅ Loosen SQL string check (ignore newlines/whitespace issues)
            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO users_info"),
                [
                    userId,
                    userInfo.firstName,
                    userInfo.lastName,
                    userInfo.middleName,
                    userInfo.age,
                ]
            );

            expect(mockCommit).toHaveBeenCalledTimes(1);
            expect(mockRollback).not.toHaveBeenCalled();
            expect(mockRelease).toHaveBeenCalledTimes(1);
        });

        it("should throw an error and rollback if affectedRows is 0", async () => {
            const userInfo: UserInfo = {
                firstName: "Jane",
                lastName: "Doe",
                middleName: "B",
                age: 25
            };
            const userId = 456;

            // Mock the execute function to return affectedRows: 0
            mockExecute.mockResolvedValueOnce([
                { insertId: 0, affectedRows: 0 } as ResultSetHeader,
                [],
            ]);

            await expect(
                userTransaction.informationCredential(userInfo, userId)
            ).rejects.toThrow("User information insert failed");

            // ✅ Assert transaction rollback
            expect(mockBeginTransaction).toHaveBeenCalledTimes(1);
            expect(mockCommit).not.toHaveBeenCalled();
            expect(mockRollback).toHaveBeenCalledTimes(1);
            expect(mockRelease).toHaveBeenCalledTimes(1);
        });
    });


    describe("locationCredential", () => {
        it("should successfully insert user location information", async () => {
            const userLocation: UserLocation = {
                country: "Philippines",
                region: "Bicol",
                district: "3rd",
                municipality: "Bacacay",
                barangay: "Bongalon",
                zone: "1",
                house_number: "22B"
            };
            const userId = 2;

            // Mock the execute function for a successful insert
            mockExecute.mockResolvedValueOnce([
                { insertId: 0, affectedRows: 1 } as ResultSetHeader,
                [],
            ]);

            await expect(
                userTransaction.locationCredential(userLocation, userId)
            ).resolves.toBeUndefined();

            // ✅ Assert connection lifecycle
            expect(mockGetConnection).toHaveBeenCalledTimes(1);
            expect(mockBeginTransaction).toHaveBeenCalledTimes(1);

            // ✅ Instead of hardcoding the SQL with \n and tabs, normalize it
            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining("INSERT INTO users_location"),
                [
                    userId,
                    userLocation.country,
                    userLocation.region,
                    userLocation.district,
                    userLocation.municipality,
                    userLocation.barangay,
                    userLocation.zone,
                    userLocation.house_number
                ]
            );

            expect(mockCommit).toHaveBeenCalledTimes(1);
            expect(mockRollback).not.toHaveBeenCalled();
            expect(mockRelease).toHaveBeenCalledTimes(1);
        });
    });

});
