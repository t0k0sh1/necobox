import { isValidIP, isValidIPv4, isValidIPv6 } from "../ip-validator";

describe("ip-validator", () => {
  describe("isValidIPv4", () => {
    it("有効なIPv4アドレスを正しく判定する", () => {
      expect(isValidIPv4("192.168.1.1")).toBe(true);
      expect(isValidIPv4("0.0.0.0")).toBe(true);
      expect(isValidIPv4("255.255.255.255")).toBe(true);
      expect(isValidIPv4("8.8.8.8")).toBe(true);
      expect(isValidIPv4("10.0.0.1")).toBe(true);
      expect(isValidIPv4("1.2.3.4")).toBe(true);
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
      expect(isValidIPv4("192.168.1.1:8080")).toBe(false);
    });

    it("先頭の0を持つIPv4アドレスを拒否する（8進数表記の混乱を防ぐ）", () => {
      // 先頭の0は許可しない（0自体は許可）
      expect(isValidIPv4("01.02.03.04")).toBe(false);
      expect(isValidIPv4("192.168.001.001")).toBe(false);
      expect(isValidIPv4("192.168.010.1")).toBe(false);
      expect(isValidIPv4("00.0.0.0")).toBe(false);
      // 0自体は有効
      expect(isValidIPv4("0.0.0.0")).toBe(true);
    });
  });

  describe("isValidIPv6", () => {
    it("有効なIPv6アドレス（完全形式）を正しく判定する", () => {
      expect(isValidIPv6("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(true);
      expect(isValidIPv6("fe80:0000:0000:0000:0000:0000:0000:0001")).toBe(true);
    });

    it("有効なIPv6アドレス（圧縮形式）を正しく判定する", () => {
      expect(isValidIPv6("2001:db8:85a3::8a2e:370:7334")).toBe(true);
      expect(isValidIPv6("::1")).toBe(true);
      expect(isValidIPv6("::")).toBe(true);
      expect(isValidIPv6("fe80::1")).toBe(true);
      expect(isValidIPv6("2001:db8::")).toBe(true);
      expect(isValidIPv6("::ffff:0:0")).toBe(true);
    });

    it("無効なIPv6アドレスを正しく判定する", () => {
      // グループが多すぎる
      expect(isValidIPv6("2001:db8:85a3:0000:0000:8a2e:0370:7334:extra")).toBe(
        false
      );
      // 不正な文字
      expect(isValidIPv6("2001:db8:85a3::8a2e:370g:7334")).toBe(false);
      // IPv4形式
      expect(isValidIPv6("192.168.1.1")).toBe(false);
      // 空文字列
      expect(isValidIPv6("")).toBe(false);
      // :: が複数回出現
      expect(isValidIPv6("2001::85a3::7334")).toBe(false);
      // グループが5文字以上
      expect(isValidIPv6("2001:0db8:85a3:00000:0000:8a2e:0370:7334")).toBe(
        false
      );
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
      expect(isValidIP(" ::1 ")).toBe(true);
    });

    it("無効な文字列を正しく判定する", () => {
      expect(isValidIP("google.com")).toBe(false);
      expect(isValidIP("not an ip")).toBe(false);
      expect(isValidIP("")).toBe(false);
      expect(isValidIP("   ")).toBe(false);
      expect(isValidIP("192.168.1.1:8080")).toBe(false);
    });

    it("先頭の0を持つIPv4アドレスを拒否する", () => {
      expect(isValidIP("01.02.03.04")).toBe(false);
      expect(isValidIP("192.168.001.001")).toBe(false);
    });
  });
});
