// reference: https://www.geeksforgeeks.org/how-to-check-if-a-given-point-lies-inside-a-polygon/

class Point {
    //int long, y;
    constructor(long,lat)
    {
        this.long=long;
        this.lat=lat;
    }
}
 
class line {
    //Point p1, p2;
    constructor(p1,p2)
    {
        this.p1=p1;
        this.p2=p2;
    }
 
};
 
function onLine(l1, p)
{
    // Check whether p is on the line or not
    if (p.long <= Math.max(l1.p1.long, l1.p2.long)
        && p.long <= Math.min(l1.p1.long, l1.p2.long)
        && (p.lat <= Math.max(l1.p1.lat, l1.p2.lat)
            && p.lat <= Math.min(l1.p1.lat, l1.p2.lat)))
        return true;
 
    return false;
}
 
function direction(a, b, c)
{
    let val = (b.lat - a.lat) * (c.long - b.long)
              - (b.long - a.long) * (c.lat - b.lat);
 
    if (val == 0)
 
        // Collinear: lying in the same straight line.
        return 0;
 
    else if (val < 0)
 
        // Counter-Clockwise
        return 2;
 
    // Clockwise
    return 1;
}
 
function isIntersect(l1, l2)
{
    // Four direction for two lines and points of other line
    let dir1 = direction(l1.p1, l1.p2, l2.p1);
    let dir2 = direction(l1.p1, l1.p2, l2.p2);
    let dir3 = direction(l2.p1, l2.p2, l1.p1);
    let dir4 = direction(l2.p1, l2.p2, l1.p2);
 
    // When intersecting
    if (dir1 != dir2 && dir3 != dir4)
        return true;
 
    // When p2 of line2 are on the line1
    if (dir1 == 0 && onLine(l1, l2.p1))
        return true;
 
    // When p1 of line2 are on the line1
    if (dir2 == 0 && onLine(l1, l2.p2))
        return true;
 
    // When p2 of line1 are on the line2
    if (dir3 == 0 && onLine(l2, l1.p1))
        return true;
 
    // When p1 of line1 are on the line2
    if (dir4 == 0 && onLine(l2, l1.p2))
        return true;
 
    return false;
}
 
function checkInside(poly, n, p)
{
 
    // When polygon has less than 3 edge, it is not polygon
    if (n < 3)
        return false;
 
    // Create a point at infinity, y is same as point p
    let tmp=new Point(9999, p.lat);
    let exline = new line( p, tmp );
    let count = 0;
    let i = 0;
    do {
 
        // Forming a line from two consecutive points of
        // poly
        let side = new line( poly[i], poly[(i + 1) % n] );
        if (isIntersect(side, exline)) {
 
            // If side is intersects exline
            if (direction(side.p1, p, side.p2) == 0)
                return onLine(side, p);
            count++;
        }
        i = (i + 1) % n;
    } while (i != 0);
 
    // When count is odd
    return count & 1;
}

module.exports = {Point,checkInside};

