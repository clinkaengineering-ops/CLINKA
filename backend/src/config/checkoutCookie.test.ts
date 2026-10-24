import {
  CHECKOUT_RETURN_COOKIE,
  readCheckoutReturnCookie,
  setCheckoutReturnCookie,
  clearCheckoutReturnCookie,
} from "./checkoutCookie";
import type { Response } from "express";

describe("checkoutCookie", () => {
  describe("readCheckoutReturnCookie", () => {
    it("returns null for empty or whitespace raw input", () => {
      expect(readCheckoutReturnCookie(undefined)).toBeNull();
      expect(readCheckoutReturnCookie("")).toBeNull();
      expect(readCheckoutReturnCookie("   ")).toBeNull();
    });

    it("returns null for malformed JSON", () => {
      expect(readCheckoutReturnCookie("{not valid json")).toBeNull();
    });

    it("returns null when projectId is not a non-empty string", () => {
      // number instead of string
      expect(
        readCheckoutReturnCookie(JSON.stringify({ projectId: 123, paymentId: 456 })),
      ).toBeNull();
      // empty string
      expect(
        readCheckoutReturnCookie(JSON.stringify({ projectId: "", paymentId: 456 })),
      ).toBeNull();
      // whitespace-only string
      expect(
        readCheckoutReturnCookie(JSON.stringify({ projectId: "   ", paymentId: 456 })),
      ).toBeNull();
      // missing projectId
      expect(
        readCheckoutReturnCookie(JSON.stringify({ paymentId: 456 })),
      ).toBeNull();
    });

    it("returns null when paymentId is invalid or non-positive", () => {
      expect(
        readCheckoutReturnCookie(
          JSON.stringify({ projectId: "123e4567-e89b-12d3-a456-426614174000", paymentId: 0 }),
        ),
      ).toBeNull();
      expect(
        readCheckoutReturnCookie(
          JSON.stringify({ projectId: "123e4567-e89b-12d3-a456-426614174000", paymentId: -5 }),
        ),
      ).toBeNull();
      expect(
        readCheckoutReturnCookie(
          JSON.stringify({ projectId: "123e4567-e89b-12d3-a456-426614174000", paymentId: "456" }),
        ),
      ).toBeNull();
    });

    it("returns parsed cookie when projectId is a valid string UUID and paymentId is positive integer", () => {
      const payload = {
        projectId: "b3b7e77a-2415-46b0-96f3-fec4e9c71a3e",
        paymentId: 101,
      };
      const result = readCheckoutReturnCookie(JSON.stringify(payload));
      expect(result).toEqual(payload);
    });
  });

  describe("setCheckoutReturnCookie & clearCheckoutReturnCookie", () => {
    it("sets cookie with serialized payload", () => {
      const mockRes = {
        cookie: jest.fn(),
      } as unknown as Response;

      setCheckoutReturnCookie(mockRes, {
        projectId: "b3b7e77a-2415-46b0-96f3-fec4e9c71a3e",
        paymentId: 101,
      });

      expect(mockRes.cookie).toHaveBeenCalledWith(
        CHECKOUT_RETURN_COOKIE,
        JSON.stringify({
          projectId: "b3b7e77a-2415-46b0-96f3-fec4e9c71a3e",
          paymentId: 101,
        }),
        expect.objectContaining({
          maxAge: 7200000,
        }),
      );
    });

    it("clears the cookie", () => {
      const mockRes = {
        clearCookie: jest.fn(),
      } as unknown as Response;

      clearCheckoutReturnCookie(mockRes);
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        CHECKOUT_RETURN_COOKIE,
        expect.any(Object),
      );
    });
  });
});
