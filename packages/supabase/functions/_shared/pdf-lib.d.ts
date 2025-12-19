/**
 * Type declarations for pdf-lib npm package used in Deno Edge Functions.
 *
 * This provides minimal type definitions for the exports used in work-log-export.ts.
 * Based on pdf-lib@1.17.1
 */
declare module "pdf-lib" {
  export interface PDFPageDrawTextOptions {
    x?: number;
    y?: number;
    size?: number;
    font?: PDFFont;
    color?: RGB | Grayscale | CMYK;
    opacity?: number;
    lineHeight?: number;
    maxWidth?: number;
    wordBreaks?: string[];
    blendMode?: BlendMode;
    rotate?: Rotation;
    xSkew?: Rotation;
    ySkew?: Rotation;
  }

  export interface RGB {
    type: 'RGB';
    red: number;
    green: number;
    blue: number;
  }

  export interface Grayscale {
    type: 'Grayscale';
    gray: number;
  }

  export interface CMYK {
    type: 'CMYK';
    cyan: number;
    magenta: number;
    yellow: number;
    key: number;
  }

  export type BlendMode =
    | "Normal"
    | "Multiply"
    | "Screen"
    | "Overlay"
    | "Darken"
    | "Lighten"
    | "ColorDodge"
    | "ColorBurn"
    | "HardLight"
    | "SoftLight"
    | "Difference"
    | 'Exclusion';

  export interface Rotation {
    angle: number;
    type: 'degrees' | 'radians';
  }

  export class PDFFont {
    widthOfTextAtSize(text: string, size: number): number;
    heightAtSize(size: number, options?: { descender?: boolean }): number;
    sizeAtHeight(height: number): number;
    getCharacterSet(): number[];
  }

  export class PDFPage {
    getWidth(): number;
    getHeight(): number;
    getSize(): { width: number; height: number };
    setSize(width: number, height: number): void;
    setWidth(width: number): void;
    setHeight(height: number): void;
    drawText(text: string, options?: PDFPageDrawTextOptions): void;
    drawLine(options: {
      start: { x: number; y: number };
      end: { x: number; y: number };
      thickness?: number;
      color?: RGB | Grayscale | CMYK;
      opacity?: number;
      lineCap?: 'butt' | 'round' | 'projecting';
      dashArray?: number[];
      dashPhase?: number;
      blendMode?: BlendMode;
    }): void;
    drawRectangle(options?: {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      borderWidth?: number;
      borderColor?: RGB | Grayscale | CMYK;
      color?: RGB | Grayscale | CMYK;
      opacity?: number;
      borderOpacity?: number;
      rotate?: Rotation;
      xSkew?: Rotation;
      ySkew?: Rotation;
      blendMode?: BlendMode;
      borderLineCap?: 'butt' | 'round' | 'projecting';
      borderDashArray?: number[];
      borderDashPhase?: number;
    }): void;
  }

  export class PDFDocument {
    static create(): Promise<PDFDocument>;
    static load(
      pdf: string | Uint8Array | ArrayBuffer,
      options?: {
        ignoreEncryption?: boolean;
        parseSpeed?: number;
        throwOnInvalidObject?: boolean;
        updateMetadata?: boolean;
        capNumbers?: boolean;
      },
    ): Promise<PDFDocument>;
    addPage(size?: [number, number] | PDFPage): PDFPage;
    insertPage(index: number, size?: [number, number] | PDFPage): PDFPage;
    removePage(index: number): void;
    getPage(index: number): PDFPage;
    getPages(): PDFPage[];
    getPageCount(): number;
    embedFont(
      font: StandardFonts | string | Uint8Array | ArrayBuffer,
    ): Promise<PDFFont>;
    save(options?: {
      useObjectStreams?: boolean;
      addDefaultPage?: boolean;
      objectsPerTick?: number;
      updateFieldAppearances?: boolean;
    }): Promise<Uint8Array>;
    saveAsBase64(options?: {
      dataUri?: boolean;
      useObjectStreams?: boolean;
      addDefaultPage?: boolean;
      objectsPerTick?: number;
      updateFieldAppearances?: boolean;
    }): Promise<string>;
  }

  export enum StandardFonts {
    Courier = "Courier",
    CourierBold = "Courier-Bold",
    CourierBoldOblique = "Courier-BoldOblique",
    CourierOblique = "Courier-Oblique",
    Helvetica = "Helvetica",
    HelveticaBold = "Helvetica-Bold",
    HelveticaBoldOblique = "Helvetica-BoldOblique",
    HelveticaOblique = "Helvetica-Oblique",
    Symbol = "Symbol",
    TimesRoman = "Times-Roman",
    TimesRomanBold = "Times-Bold",
    TimesRomanBoldItalic = "Times-BoldItalic",
    TimesRomanItalic = "Times-Italic",
    ZapfDingbats = "ZapfDingbats",
  }

  export function rgb(red: number, green: number, blue: number): RGB;
  export function grayscale(gray: number): Grayscale;
  export function cmyk(
    cyan: number,
    magenta: number,
    yellow: number,
    key: number,
  ): CMYK;
  export function degrees(angle: number): Rotation;
  export function radians(angle: number): Rotation;
}
