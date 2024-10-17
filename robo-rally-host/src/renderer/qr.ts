import qrcodegen from "nayuki-qr-code-generator";

export function toSvgString(qr: qrcodegen.QrCode, border: number=2/*, lightColor: string, darkColor: string*/): string {
    if (border < 0)
        throw new RangeError("Border must be non-negative");
    let parts: Array<string> = [];
    for (let y = 0; y < qr.size; y++) {
        for (let x = 0; x < qr.size; x++) {
            if (qr.getModule(x, y))
                parts.push(`M${x + border},${y + border}h1v1h-1z`);
        }
    }
//     return `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${qr.size + border * 2} ${qr.size + border * 2}" stroke="none">
// <rect width="100%" height="100%" fill="${lightColor}"/>
// <path d="${parts.join(" ")}" fill="${darkColor}"/>
// </svg>
// `;
    return parts.join(" ")
}