/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If
 * not, see <https://www.gnu.org/licenses/>.
 */

export { };

type StackValue = { a: number, b: number, c: number, d: number, e: number, f: number };
type Stack = StackValue[];


declare global {
  interface CanvasRenderingContext2D {
    _t2stack: Stack;
    setTransform(_a: number, _b: number, _c: number, _d: number, _e: number, _f: number): void;
  }

  interface HTMLCanvasElement {
    getContext(_contextId: "2d", _options?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D | null;
  }
}

const canvasPolyfill = () => {
  if (CanvasRenderingContext2D.prototype.ellipse === undefined) {
    CanvasRenderingContext2D.prototype.ellipse = function (x, y, radiusX, radiusY, rotation, startAngle, endAngle, antiClockwise) {
      this.save();
      this.translate(x, y);
      this.rotate(rotation);
      this.scale(radiusX, radiusY);
      this.arc(0, 0, 1, startAngle, endAngle, antiClockwise);
      this.restore();
    }
  }

  (function () {
    if (CanvasRenderingContext2D.prototype.getTransform !== undefined) {
      return;
    }
    const setTransform = CanvasRenderingContext2D.prototype.setTransform;
    CanvasRenderingContext2D.prototype.getTransform = function (): DOMMatrix {
      console.assert(this._t2stack);
      const m = new DOMMatrix();
      const t = this._t2stack[this._t2stack.length - 1];
      m.a = t.a;
      m.b = t.b;
      m.c = t.c;
      m.d = t.d;
      m.e = t.e;
      m.f = t.f;

      return m;
    };

    const save = CanvasRenderingContext2D.prototype.save;
    CanvasRenderingContext2D.prototype.save = function () {
      const t = this.getTransform();
      this._t2stack.push({ a: t.a, b: t.b, c: t.c, d: t.d, e: t.e, f: t.f });
      save.call(this);
      setTransform.call(this, t.a, t.b, t.c, t.d, t.e, t.f);
    };

    const restore = CanvasRenderingContext2D.prototype.restore;
    CanvasRenderingContext2D.prototype.restore = function () {
      console.assert(this._t2stack);

      this._t2stack.pop()!;

      if (!this._t2stack.length) {
        this._t2stack.push({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
      }

      const t = this._t2stack[this._t2stack.length - 1];
      restore.call(this);
      setTransform.call(this, t.a, t.b, t.c, t.d, t.e, t.f);
    };

    CanvasRenderingContext2D.prototype.transform = function (a: number, b: number, c: number, d: number, e: number, f: number): void {
      const t = this.getTransform();

      this.setTransform(
        t.a * a + t.c * b,
        t.b * a + t.d * b,
        t.a * c + t.c * d,
        t.b * c + t.d * d,
        t.e + t.a * e + t.c * f,
        t.f + t.b * e + t.d * f
      );
    };

    CanvasRenderingContext2D.prototype.setTransform = function (a: number, b: number, c: number, d: number, e: number, f: number): void {
      // setTransform has two signature
      if (typeof a === "object" || typeof a === "undefined") {
        const { a: aa, b, c, d, e, f } = a;
        return CanvasRenderingContext2D.prototype.setTransform.call(this, aa, b, c, d, e, f);
      }

      this._t2stack[this._t2stack.length - 1] = { a: a, b: b, c: c, d: d, e: e, f: f };
      setTransform.call(this, a, b, c, d, e, f);
    };

    CanvasRenderingContext2D.prototype.resetTransform = function () {
      this.setTransform(1, 0, 0, 1, 0, 0);
    };

    CanvasRenderingContext2D.prototype.transform = function (a: number, b: number, c: number, d: number, e: number, f: number): void {
      const t = this.getTransform();

      this.setTransform(
        t.a * a + t.c * b,
        t.b * a + t.d * b,
        t.a * c + t.c * d,
        t.b * c + t.d * d,
        t.e + t.a * e + t.c * f,
        t.f + t.b * e + t.d * f
      );
    };

    CanvasRenderingContext2D.prototype.scale = function (sx: number, sy: number): void {
      const t = this.getTransform();
      this.setTransform(
        t.a * sx, t.b * sx,
        t.c * sy, t.d * sy,
        t.e, t.f);
    };

    CanvasRenderingContext2D.prototype.rotate = function (w: number) {
      const t = this.getTransform();

      const cw = Math.cos(w);
      const sw = Math.sin(w);

      this.setTransform(
        t.a * cw + t.c * sw,
        t.b * cw + t.d * sw,
        t.c * cw - t.a * sw,
        t.d * cw - t.b * sw,
        t.e, t.f);
    };

    CanvasRenderingContext2D.prototype.translate = function (x: number, y: number) {
      const t = this.getTransform();
      this.setTransform(t.a, t.b, t.c, t.d,
        t.e + x * t.a + y * t.c,
        t.f + x * t.b + y * t.d);
    }

    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, contextId: "2d", options?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D | null {
      const context = getContext.call(this, contextId, options);
      if (context) {
        context._t2stack = [{ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }];
      }
      return context;
    } as (typeof HTMLCanvasElement.prototype.getContext);
  })();
};

canvasPolyfill();