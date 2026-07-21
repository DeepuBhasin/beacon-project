const COMPANY_IDS = {
  0x0006: "Microsoft",
  0x004c: "Apple",
  0x0131: "Google",
};

export function decodeManufacturerData(rawHex) {
  if (!rawHex) return null;

  const bytes = rawHex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) || [];

  let i = 0;
  while (i < bytes.length) {
    const length = bytes[i];
    const type = bytes[i + 1];

    if (!length || i + length >= bytes.length) break;

    if (type === 0xff) {
      const valueBytes = bytes.slice(i + 2, i + length + 1);
      const companyId = valueBytes[0] | (valueBytes[1] << 8);

      return {
        companyId,
        companyName: COMPANY_IDS[companyId] || "Unknown",
        length,
      };
    }
    i += length + 1;
  }
  return null;
}
