import { isValidIP, isValidIPv4, isValidIPv6 } from "../ip-validator";

describe("ip-validator", () => {
  describe("isValidIPv4", () => {
    it("有効なIPv4アドレスを正しく判定する", () => {
      expect(isValidIPv4("192.168.1.1")).toBe(true);
      expect(isValidIPv4("0.0.0.0")).toBe(true);
      expect(isValidIPv4("255.255.255.255")).toBe(true);
      expect(isValidIPv4("8.8.8.8")).toBe(true);
      expect(isValidIPv4("10.0.0.1")).toBe(true);
    });

    it("無効なIPv4アドレスを正しく判定する", () => {
      expect(isValidIPv4("256.1.1.1")).toBe(false);
      expect(isValidIPv4("1.1.1")).toBe(false);
      expect(isValidIPv4("1.1.1.1.1")).toBe(false);
      expect(isValidIPv4("192.168.1.")).toBe(false);
      expect(isValidIPv4(".192.168.1.1")).toBe(false);
      expect(isValidIPv4("192.168.1.1a")).toBe(false);
      expect(isValidIPv4("abc.def.ghi.jkl")).toBe(false);
      expect(isValidIPv4("")).toBe(false);
    });
  });

  describe("isValidIPv6", () => {
    it("有効なIPv6アドレスを正しく判定する", () => {
      expect(isValidIPv6("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(true);
      expect(isValidIPv6("2001:db8:85a3::8a2e:370:7334")).toBe(true);
      expect(isValidIPv6("::1")).toBe(true);
      expect(isValidIPv6("::")).toBe(true);
      expect(isValidIPv6("fe80::1")).toBe(true);
      expect(isValidIPv6("2001:db8::")).toBe(true);
    });

    it("無効なIPv6アドレスを正しく判定する", () => {
      expect(isValidIPv6("2001:db8:85a3:0000:0000:8a2e:0370:7334:extra")).toBe(
        false
      );
      expect(isValidIPv6("2001:db8:85a3::8a2e:370g:7334")).toBe(false);
      expect(isValidIPv6("192.168.1.1")).toBe(false);
      expect(isValidIPv6("")).toBe(false);
    });
  });

  describe("isValidIP", () => {
    it("IPv4とIPv6の両方を正しく判定する", () => {
      // IPv4
      expect(isValidIP("192.168.1.1")).toBe(true);
      expect(isValidIP("8.8.8.8")).toBe(true);

      // IPv6
      expect(isValidIP("2001:db8:85a3::8a2e:370:7334")).toBe(true);
      expect(isValidIP("::1")).toBe(true);
    });

    it("前後の空白をトリムして判定する", () => {
      expect(isValidIP(" 192.168.1.1 ")).toBe(true);
      expect(isValidIP("\t8.8.8.8\n")).toBe(true);
    });

    it("無効な文字列を正しく判定する", () => {
      expect(isValidIP("google.com")).toBe(false);
      expect(isValidIP("not an ip")).toBe(false);
      expect(isValidIP("")).toBe(false);
      expect(isValidIP("192.168.1.1:8080")).toBe(false);
    });
  });
});
