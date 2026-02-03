import { formatFileSize } from "../format";

describe("formatFileSize", () => {
  it("0バイトの場合", () => {
    expect(formatFileSize(0)).toBe("0 Bytes");
  });

  it("バイト単位の場合", () => {
    expect(formatFileSize(512)).toBe("512 Bytes");
    expect(formatFileSize(1023)).toBe("1023 Bytes");
  });

  it("KB単位の場合", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(1048575)).toBe("1024 KB");
  });

  it("MB単位の場合", () => {
    expect(formatFileSize(1048576)).toBe("1 MB");
    expect(formatFileSize(1572864)).toBe("1.5 MB");
    expect(formatFileSize(10485760)).toBe("10 MB");
  });

  it("GB単位の場合", () => {
    expect(formatFileSize(1073741824)).toBe("1 GB");
    expect(formatFileSize(2147483648)).toBe("2 GB");
  });

  it("小数点以下の桁数を指定できる", () => {
    expect(formatFileSize(1536, 0)).toBe("2 KB");
    expect(formatFileSize(1536, 1)).toBe("1.5 KB");
    expect(formatFileSize(1536, 3)).toBe("1.5 KB");
  });

  it("非常に大きな値でもエラーにならない", () => {
    expect(formatFileSize(1099511627776)).toBe("1 TB");
    expect(formatFileSize(1125899906842624)).toBe("1024 TB");
  });
});
