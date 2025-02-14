const { Builder, Browser, By, Key, until } = require("selenium-webdriver");
const { assert, expect } = require("chai");
const {Point, checkInside } = require('../src/PolygonBuilder.js'); 

const poly = [];
poly.push(new Point(0,0));
poly.push(new Point(0,5));
poly.push(new Point(5,5));
poly.push(new Point(5,0));
poly.push(new Point(0,0));

describe('checkInside Function', () => {
  it('should return true for points inside', () => {
    n = poly.length;
    const point = new Point(3,3);
    const result = checkInside(poly, n, point);
    expect(result).to.equal(1);
  });

  it('should return false for points outside', () => {
    n = poly.length;
    const point = new Point(6,6);
    const result = checkInside(poly, n, point);
    expect(result).to.equal(0);
  });

  it('should handle edge cases that fall on a line', () => {
    n = poly.length;
    const point = new Point(4,5);
    const result = checkInside(poly, n, point);
    expect(result).to.equal(false);
  });
});