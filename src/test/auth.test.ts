import { describe, it, expect, beforeAll } from "vitest";
import { makeJWT, validateJWT, hashPassword, checkPasswordHash } from "../api/auth.js";

describe("JWT Authentication", () => {
  const testSecret = "test-secret-key";
  const testUserID = "test-user-123";
  const wrongSecret = "wrong-secret-key";

  describe("makeJWT", () => {
    it("should create a valid JWT with correct structure", () => {
      const expiresIn = 3600; // 1 hour
      const token = makeJWT(testUserID, expiresIn, testSecret);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts separated by dots
    });

    it("should create tokens with different expiration times", () => {
      const shortExpiry = makeJWT(testUserID, 60, testSecret); // 1 minute
      const longExpiry = makeJWT(testUserID, 3600, testSecret); // 1 hour
      
      expect(shortExpiry).toBeDefined();
      expect(longExpiry).toBeDefined();
      expect(shortExpiry).not.toBe(longExpiry);
    });

    it("should create different tokens for different users", () => {
      const token1 = makeJWT("user1", 3600, testSecret);
      const token2 = makeJWT("user2", 3600, testSecret);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe("validateJWT", () => {
    it("should validate a correct JWT and return user ID", () => {
      const expiresIn = 3600;
      const token = makeJWT(testUserID, expiresIn, testSecret);
      
      const userID = validateJWT(token, testSecret);
      expect(userID).toBe(testUserID);
    });

    it("should reject JWT signed with wrong secret", () => {
      const token = makeJWT(testUserID, 3600, testSecret);
      
      expect(() => {
        validateJWT(token, wrongSecret);
      }).toThrow();
    });

    it("should reject expired JWT", async () => {
      // Create a token that expires in 1 second
      const shortLivedToken = makeJWT(testUserID, 1, testSecret);
      
      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(() => {
        validateJWT(shortLivedToken, testSecret);
      }).toThrow();
    });

    it("should reject malformed JWT", () => {
      const malformedToken = "not.a.valid.jwt.token";
      
      expect(() => {
        validateJWT(malformedToken, testSecret);
      }).toThrow();
    });

    it("should reject completely invalid token string", () => {
      const invalidToken = "invalid-token";
      
      expect(() => {
        validateJWT(invalidToken, testSecret);
      }).toThrow();
    });

    it("should reject empty token string", () => {
      expect(() => {
        validateJWT("", testSecret);
      }).toThrow();
    });

    it("should handle different error types appropriately", () => {
      // Test invalid signature
      expect(() => {
        const token = makeJWT(testUserID, 3600, testSecret);
        validateJWT(token, wrongSecret);
      }).toThrow();

      // Test malformed JWT
      expect(() => {
        validateJWT("header.payload", testSecret);
      }).toThrow();

      // Test invalid base64 in JWT
      expect(() => {
        validateJWT("invalid.invalid.invalid", testSecret);
      }).toThrow();
    });
  });

  describe("JWT payload verification", () => {
    it("should include correct issuer (chirpy)", () => {
      const token = makeJWT(testUserID, 3600, testSecret);
      
      // Decode token manually to check payload structure
      const [, payloadBase64] = token.split(".");
      const payload = JSON.parse(Buffer.from(payloadBase64, "base64").toString());
      
      expect(payload.iss).toBe("chirpy");
      expect(payload.sub).toBe(testUserID);
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
      expect(payload.exp).toBe(payload.iat + 3600);
    });

    it("should have consistent issued at time", () => {
      const beforeTime = Math.floor(Date.now() / 1000);
      const token = makeJWT(testUserID, 3600, testSecret);
      const afterTime = Math.floor(Date.now() / 1000);
      
      const [, payloadBase64] = token.split(".");
      const payload = JSON.parse(Buffer.from(payloadBase64, "base64").toString());
      
      expect(payload.iat).toBeGreaterThanOrEqual(beforeTime);
      expect(payload.iat).toBeLessThanOrEqual(afterTime);
    });
  });

  describe("Password Hashing", () => {
    const testPassword = "mySecurePassword123";
    const wrongPassword = "wrongPassword456";

    describe("hashPassword", () => {
      it("should hash a password and return a string", async () => {
        const hashedPassword = await hashPassword(testPassword);
        
        expect(hashedPassword).toBeDefined();
        expect(typeof hashedPassword).toBe("string");
        expect(hashedPassword).not.toBe(testPassword); // Should not be plain text
        expect(hashedPassword.length).toBeGreaterThan(0);
      });

      it("should produce different hashes for the same password", async () => {
        const hash1 = await hashPassword(testPassword);
        const hash2 = await hashPassword(testPassword);
        
        // Argon2 includes salt, so same password should produce different hashes
        expect(hash1).not.toBe(hash2);
      });

      it("should produce different hashes for different passwords", async () => {
        const hash1 = await hashPassword(testPassword);
        const hash2 = await hashPassword(wrongPassword);
        
        expect(hash1).not.toBe(hash2);
      });

      it("should handle empty password", async () => {
        const emptyHash = await hashPassword("");
        
        expect(emptyHash).toBeDefined();
        expect(typeof emptyHash).toBe("string");
      });

      it("should handle special characters in password", async () => {
        const specialPassword = "p@ssw0rd!#$%^&*()";
        const hashedPassword = await hashPassword(specialPassword);
        
        expect(hashedPassword).toBeDefined();
        expect(typeof hashedPassword).toBe("string");
      });
    });

    describe("checkPasswordHash", () => {
      it("should verify correct password against its hash", async () => {
        const hashedPassword = await hashPassword(testPassword);
        const isValid = await checkPasswordHash(testPassword, hashedPassword);
        
        expect(isValid).toBe(true);
      });

      it("should reject incorrect password against hash", async () => {
        const hashedPassword = await hashPassword(testPassword);
        const isValid = await checkPasswordHash(wrongPassword, hashedPassword);
        
        expect(isValid).toBe(false);
      });

      it("should handle empty password verification", async () => {
        const emptyHash = await hashPassword("");
        const isValidEmpty = await checkPasswordHash("", emptyHash);
        const isValidWrong = await checkPasswordHash("notEmpty", emptyHash);
        
        expect(isValidEmpty).toBe(true);
        expect(isValidWrong).toBe(false);
      });

      it("should handle case sensitivity", async () => {
        const password = "MyPassword";
        const hashedPassword = await hashPassword(password);
        const isValidSame = await checkPasswordHash("MyPassword", hashedPassword);
        const isValidDifferentCase = await checkPasswordHash("mypassword", hashedPassword);
        
        expect(isValidSame).toBe(true);
        expect(isValidDifferentCase).toBe(false);
      });

      it("should reject invalid hash format", async () => {
        const invalidHash = "not-a-valid-argon2-hash";
        
        // This should throw an error or return false
        await expect(async () => {
          await checkPasswordHash(testPassword, invalidHash);
        }).rejects.toThrow();
      });

      it("should handle whitespace differences", async () => {
        const password = "password123";
        const passwordWithSpaces = " password123 ";
        const hashedPassword = await hashPassword(password);
        
        const isValidExact = await checkPasswordHash(password, hashedPassword);
        const isValidWithSpaces = await checkPasswordHash(passwordWithSpaces, hashedPassword);
        
        expect(isValidExact).toBe(true);
        expect(isValidWithSpaces).toBe(false); // Should be strict about whitespace
      });
    });

    describe("Password Security Properties", () => {
      it("should create hashes that are computationally expensive", async () => {
        const startTime = Date.now();
        await hashPassword(testPassword);
        const endTime = Date.now();
        
        // Argon2 should take some time (at least a few milliseconds)
        const timeTaken = endTime - startTime;
        expect(timeTaken).toBeGreaterThan(1); // Should take more than 1ms
      });

      it("should verify hashes that are computationally expensive", async () => {
        const hashedPassword = await hashPassword(testPassword);
        
        const startTime = Date.now();
        await checkPasswordHash(testPassword, hashedPassword);
        const endTime = Date.now();
        
        // Verification should also take some time
        const timeTaken = endTime - startTime;
        expect(timeTaken).toBeGreaterThan(1); // Should take more than 1ms
      });
    });
  });

  describe("Integration Tests", () => {
    const testUserID = "integration-test-user";
    const testSecret = "integration-test-secret";
    const testPassword = "integrationTestPassword123";

    it("should work together: hash password, create JWT, validate JWT", async () => {
      // Hash a password
      const hashedPassword = await hashPassword(testPassword);
      
      // Verify the password
      const isPasswordValid = await checkPasswordHash(testPassword, hashedPassword);
      expect(isPasswordValid).toBe(true);
      
      // Create JWT for authenticated user
      const token = makeJWT(testUserID, 3600, testSecret);
      
      // Validate JWT
      const extractedUserID = validateJWT(token, testSecret);
      expect(extractedUserID).toBe(testUserID);
    });

    it("should handle complete authentication flow", async () => {
      // 1. Register user (hash password)
      const userPassword = "newUserPassword123";
      const hashedPassword = await hashPassword(userPassword);
      
      // 2. Login attempt with correct password
      const isLoginValid = await checkPasswordHash(userPassword, hashedPassword);
      expect(isLoginValid).toBe(true);
      
      // 3. Create session token
      const sessionToken = makeJWT(testUserID, 1800, testSecret); // 30 minutes
      
      // 4. Validate session token
      const sessionUserID = validateJWT(sessionToken, testSecret);
      expect(sessionUserID).toBe(testUserID);
      
      // 5. Login attempt with wrong password should fail
      const isWrongPasswordValid = await checkPasswordHash("wrongPassword", hashedPassword);
      expect(isWrongPasswordValid).toBe(false);
    });

    it("should handle password change scenario", async () => {
      const oldPassword = "oldPassword123";
      const newPassword = "newPassword456";
      
      // Hash old password
      const oldHash = await hashPassword(oldPassword);
      
      // Verify old password works
      expect(await checkPasswordHash(oldPassword, oldHash)).toBe(true);
      
      // Hash new password
      const newHash = await hashPassword(newPassword);
      
      // Verify new password works with new hash
      expect(await checkPasswordHash(newPassword, newHash)).toBe(true);
      
      // Verify old password doesn't work with new hash
      expect(await checkPasswordHash(oldPassword, newHash)).toBe(false);
      
      // Verify new password doesn't work with old hash
      expect(await checkPasswordHash(newPassword, oldHash)).toBe(false);
    });
  });
});
