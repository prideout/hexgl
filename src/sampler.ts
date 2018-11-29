interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

export default class Sampler {
    private image: HTMLImageElement;
    private pixels: ImageData;
    private canvas: HTMLCanvasElement;
    public width: number;
    public height: number;

    constructor(url: string, cb: () => void) {
        this.image = new Image();
        this.pixels = null;
        this.canvas = null;
        this.image.onload = () => {
            const canvas = this.canvas = document.createElement("canvas");
            this.canvas.width = this.image.width;
            this.canvas.height = this.image.height;
            const context = this.canvas.getContext("2d");
            context.drawImage(this.image, 0, 0);
            this.pixels = context.getImageData(0, 0, canvas.width, canvas.height);
            this.width = this.pixels.width;
            this.height = this.pixels.height;
            this.canvas = null;
            this.image = null;
            cb();
        };
        this.image.src = url;
    }

    public getPixel(x: number, y: number): Color {
        if (!this.pixels || x < 0 || y < 0 || x >= this.pixels.width || y >= this.pixels.height) {
            return {r: 0, g: 0, b: 0, a: 0};
        }
        const i = (y * this.pixels.width + x) * 4;
        return {
            r: this.pixels.data[i],
            g: this.pixels.data[i + 1],
            b: this.pixels.data[i + 2],
            a: this.pixels.data[i + 3],
        };
    }

    public getPixelBilinear(fx: number, fy: number): Color {
        const x = Math.floor(fx);
        const y = Math.floor(fy);
        const rx = fx - x - .5;
        const ry = fy - y - .5;
        const ax = Math.abs(rx);
        const ay = Math.abs(ry);
        const dx = rx < 0 ? -1 : 1;
        const dy = ry < 0 ? -1 : 1;
        const c = this.getPixel(x, y);
        const cx = this.getPixel(x + dx, y);
        const cy = this.getPixel(x, y + dy);
        const cxy = this.getPixel(x + dx, y + dy);
        const cf1 = [
            (1-ax) * c.r + ax * cx.r,
            (1-ax) * c.g + ax * cx.g,
            (1-ax) * c.b + ax * cx.b,
            (1-ax) * c.a + ax * cx.a,
        ];
        const cf2 = [
            (1-ax) * cy.r + ax * cxy.r,
            (1-ax) * cy.g + ax * cxy.g,
            (1-ax) * cy.b + ax * cxy.b,
            (1-ax) * cy.a + ax * cxy.a,
        ];
        return {
            r: (1-ay) * cf1[0] + ay * cf2[0],
            g: (1-ay) * cf1[1] + ay * cf2[1],
            b: (1-ay) * cf1[2] + ay * cf2[2],
            a: (1-ay) * cf1[3] + ay * cf2[3],
        };
    }

    public getPixelF(x: number, y: number): number {
        const c = this.getPixel(x, y);
        return c.r + c.g * 255 + c.b * 255 * 255;
    }

    public getPixelFBilinear(x: number, y: number): number {
        const c = this.getPixelBilinear(x, y);
        return c.r + c.g * 255 + c.b * 255 * 255;
    }
}
