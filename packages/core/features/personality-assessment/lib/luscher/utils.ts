// Color definitions from luscher-test package
// These enums are not exported from the main package, so we define them here
export enum ColorHex {
  BLUE = "#004983",
  GREEN = "#1D9772",
  RED = "#F12F23",
  YELLOW = "#F2DD00",
  PURPLE = "#D42481",
  BROWN = "#C55223",
  BLACK = "#231F20",
  GRAY = "#98938D",
}

export enum MainColor {
  GRAY = 0,
  BLUE = 1,
  GREEN = 2,
  RED = 3,
  YELLOW = 4,
  PURPLE = 5,
  BROWN = 6,
  BLACK = 7,
}

// Export type for TypeScript
export type { MainColor as MainColorType };

type ColorKey = keyof typeof MainColor;

export interface Color {
  key: ColorKey;
  hex: ColorHex;
  value: MainColor;
  selected: boolean;
}

export function colorChoices(): Color[] {
  const arr: Color[] = [];

  // Define colors in the standard Lüscher test order
  const colorOrder: Array<{ key: ColorKey; hex: ColorHex; value: MainColor }> =
    [
      { key: "BLUE", hex: ColorHex.BLUE, value: MainColor.BLUE },
      { key: "GREEN", hex: ColorHex.GREEN, value: MainColor.GREEN },
      { key: "RED", hex: ColorHex.RED, value: MainColor.RED },
      { key: "YELLOW", hex: ColorHex.YELLOW, value: MainColor.YELLOW },
      { key: "PURPLE", hex: ColorHex.PURPLE, value: MainColor.PURPLE },
      { key: "BROWN", hex: ColorHex.BROWN, value: MainColor.BROWN },
      { key: "BLACK", hex: ColorHex.BLACK, value: MainColor.BLACK },
      { key: "GRAY", hex: ColorHex.GRAY, value: MainColor.GRAY },
    ];

  for (const color of colorOrder) {
    arr.push({ ...color, selected: false });
  }

  return arr;
}
