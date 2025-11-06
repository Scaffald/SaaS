// Re-export types and enums from luscher-test package
export {
  ColorHex,
  MainColor,
  type MainColor as MainColorType,
} from "luscher-test";

type ColorKey = keyof typeof MainColor;

export interface Color {
  key: ColorKey;
  hex: ColorHex;
  value: MainColor;
  selected: boolean;
}

export function colorChoices(): Color[] {
  const arr: Color[] = [];

  // Iterate through ColorHex enum to get all colors
  // MainColor enum has both numeric keys (0-7) and string keys (BLUE, GREEN, etc.)
  for (const key in ColorHex) {
    if (Object.prototype.hasOwnProperty.call(ColorHex, key)) {
      const hex = ColorHex[key as keyof typeof ColorHex];
      // Use the string key to get the MainColor value
      const value = MainColor[key as keyof typeof MainColor];
      if (value !== undefined && typeof value === "number") {
        arr.push({ key: key as ColorKey, hex, value, selected: false });
      }
    }
  }

  return arr;
}
