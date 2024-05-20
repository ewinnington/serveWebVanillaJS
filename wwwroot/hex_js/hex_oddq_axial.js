/* All the following functions are from redblobgames.com/grids/hexagons/ */

///Saving this little gem for later
function cube_to_axial(cube){
    var q = cube.q;
    var r = cube.r;
    return Hex(q, r);
}

function axial_to_cube(hex){
    var q = hex.q;
    var r = hex.r;
    var s = -q-r;
    return Cube(q, r, s);
}

//We are using the odd-q axial coordinate system
function axial_to_oddq(hex) {
    var col = hex.q;
    var row = hex.r + (hex.q - (hex.q&1)) / 2;
    return OffsetCoord(col, row);
}

function oddq_to_axial(hex) {
    var q = hex.col;
    var r = hex.row - (hex.col - (hex.col&1)) / 2;
    return Hex(q, r);
}

var axial_direction_vectors = [
    Hex(+1, 0), //N
    Hex(+1, -1), //NE
    Hex(0, -1), //SE
    Hex(-1, 0), //S
    Hex(-1, +1), //SW
    Hex(0, +1) //NW
]

function axial_direction(direction) {
    return axial_direction_vectors[direction];
}

function axial_add(hex, vec) {
    return Hex(hex.q + vec.q, hex.r + vec.r);
}

function axial_neighbor(hex, direction){
    return axial_add(hex, axial_direction(direction));
}

//odd-q offset coordinate system
var oddq_direction_differences = [
    // even cols 
    [[+1,  0], [+1, -1], [ 0, -1], 
     [-1, -1], [-1,  0], [ 0, +1]],
    // odd cols 
    [[+1, +1], [+1,  0], [ 0, -1], 
     [-1,  0], [-1, +1], [ 0, +1]],
]

function oddq_offset_neighbor(hex, direction) {
    var parity = hex.col & 1;
    var diff = oddq_direction_differences[parity][direction];
    return OffsetCoord(hex.col + diff[0], hex.row + diff[1]);
}

function cube_subtract(a, b) {
    return Cube(a.q - b.q, a.r - b.r, a.s - b.s); 
}

function cube_distance(a, b) {
    var vec = cube_subtract(a, b);
    return (abs(vec.q) + abs(vec.r) + abs(vec.s)) / 2;
}

function axial_distance(a, b) {
    return (abs(a.q - b.q) 
          + abs(a.q + a.r - b.q - b.r)
          + abs(a.r - b.r)) / 2; 
}

function lerp(a, b, t){ // for floats
    return a + (b - a) * t;
}

function cube_lerp(a, b, t){ // for hexes
    return Cube(lerp(a.q, b.q, t),
                lerp(a.r, b.r, t),
                lerp(a.s, b.s, t));
}

function cube_linedraw(a, b) {
    var N = cube_distance(a, b);
    var results = [];
    for (var i = 0; i <= N; i++) {
        results.append(cube_round(cube_lerp(a, b, 1.0/N * i)));
    }
    return results;
}

//q is N, r is SE, s is SW
function reflectQ(h) { return Cube(h.q, h.s, h.r); }
function reflectR(h) { return Cube(h.s, h.r, h.q); }
function reflectS(h) { return Cube(h.r, h.q, h.s); }

function flat_hex_to_pixel(hex){
    var x = size * (     3./2 * hex.q                    );
    var y = size * (sqrt(3)/2 * hex.q  +  sqrt(3) * hex.r);
    return Point(x, y);
}

function oddq_offset_to_pixel(hex) {
    var x = size * 3/2 * hex.col;
    var y = size * sqrt(3) * (hex.row + 0.5 * (hex.col&1));
    return Point(x, y);
}