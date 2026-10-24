import {
  isDevTunnelFrontendOrigin,
  isDevTunnelBackendOrigin,
  isAllowedOrigin,
  isAllowedApiOrigin,
  getAllowedOrigins,
} from "./cors";

describe("CORS and Dev Tunnel Security Controls", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("Dev Tunnel Origin Security", () => {
    it("strictly blocks dev tunnel origins in production mode", () => {
      process.env.NODE_ENV = "production";
      const tunnel = "https://tunnel123-3000.uks1.devtunnels.ms";
      expect(isDevTunnelFrontendOrigin(tunnel)).toBe(false);
      expect(isAllowedOrigin(tunnel)).toBe(false);
    });

    it("allows valid port-3000 dev tunnel origins in non-production mode", () => {
      process.env.NODE_ENV = "development";
      const validTunnel = "https://my-tunnel-3000.uks1.devtunnels.ms";
      expect(isDevTunnelFrontendOrigin(validTunnel)).toBe(true);
      expect(isAllowedOrigin(validTunnel)).toBe(true);
    });

    it("rejects dev tunnels that do not use port 3000", () => {
      process.env.NODE_ENV = "development";
      expect(isDevTunnelFrontendOrigin("https://my-tunnel-5000.uks1.devtunnels.ms")).toBe(false);
      expect(isDevTunnelFrontendOrigin("https://my-tunnel.uks1.devtunnels.ms")).toBe(false);
    });

    it("rejects spoofed or malformed dev tunnel domains", () => {
      process.env.NODE_ENV = "development";
      expect(isDevTunnelFrontendOrigin("https://attacker-devtunnels.ms")).toBe(false);
      expect(isDevTunnelFrontendOrigin("https://tunnel-3000.evil.com/devtunnels.ms")).toBe(false);
      expect(isDevTunnelFrontendOrigin("http://tunnel-3000.uks1.devtunnels.ms")).toBe(false); // HTTP not HTTPS
    });
  });

  describe("Allowed Origin Resolution", () => {
    it("excludes localhost in production unless explicitly configured", () => {
      process.env.NODE_ENV = "production";
      process.env.CLIENT_URL = "https://clinka.com";
      const origins = getAllowedOrigins();
      expect(origins).toContain("https://clinka.com");
      expect(origins).not.toContain("http://localhost:3000");
    });

    it("includes localhost and 127.0.0.1 in non-production", () => {
      process.env.NODE_ENV = "development";
      const origins = getAllowedOrigins();
      expect(origins).toContain("http://localhost:3000");
      expect(origins).toContain("http://127.0.0.1:3000");
    });

    it("rejects untrusted external origins in isAllowedOrigin", () => {
      process.env.NODE_ENV = "production";
      process.env.CLIENT_URL = "https://clinka.com";
      expect(isAllowedOrigin("https://evil-phishing.com")).toBe(false);
      expect(isAllowedOrigin("https://attacker.site")).toBe(false);
    });
  });

  describe("API Origin Resolution", () => {
    it("allows configured API_URL in production", () => {
      process.env.NODE_ENV = "production";
      process.env.API_URL = "https://api.clinka.com";
      expect(isAllowedApiOrigin("https://api.clinka.com")).toBe(true);
      expect(isAllowedApiOrigin("https://evil.com")).toBe(false);
    });

    it("allows localhost:5000 and 127.0.0.1:5000 in non-production", () => {
      process.env.NODE_ENV = "development";
      expect(isAllowedApiOrigin("http://localhost:5000")).toBe(true);
      expect(isAllowedApiOrigin("http://127.0.0.1:5000")).toBe(true);
      expect(isAllowedApiOrigin("https://evil.com")).toBe(false);
    });

    it("allows port 5000 dev tunnel in non-production but blocks in production", () => {
      process.env.NODE_ENV = "development";
      const devTunnelApi = "https://my-tunnel-5000.uks1.devtunnels.ms";
      expect(isDevTunnelBackendOrigin(devTunnelApi)).toBe(true);
      expect(isAllowedApiOrigin(devTunnelApi)).toBe(true);

      process.env.NODE_ENV = "production";
      expect(isDevTunnelBackendOrigin(devTunnelApi)).toBe(false);
      expect(isAllowedApiOrigin(devTunnelApi)).toBe(false);
    });
  });
});
