const canvas = document.getElementById('hexgrid');
const ctx = canvas.getContext('2d');
const directionInput = document.getElementById('direction');
const speedInput = document.getElementById('speed');
const turnInput = document.getElementById('turn');
const zoomLevelDisplay = document.getElementById('zoom-level');

const gridSizeHeight = 100;
const gridSizeWidth = 150;
const hexHeight = 52;
const hexWidth = 60;

const hexFill = 'rgba(255, 255, 255, 0)';

let zoomLevel = 1;

canvas.width = gridSizeWidth * hexWidth * zoomLevel;
canvas.height = gridSizeHeight * hexHeight * zoomLevel;

// Cache for hexagon vertices
const hexCache = {};
let reachableHexes = new Map();
let startHex = {};

const nebulaCount = 200; // Number of nebula lights
const nebulas = [];

function createNebulas() {
    for (let i = 0; i < nebulaCount; i++) {
        nebulas.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 60 + 1,
            color: `rgba(${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)},${Math.random()})`
        });
    }
}

function drawNebulas() {
    nebulas.forEach(nebula => {
        ctx.beginPath();
        ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
        ctx.fillStyle = nebula.color;
        ctx.fill();
    });
}


// Function to generate hexagon vertices
function generateHexVertices(size) {
    if (hexCache[size]) return hexCache[size];

    const vertices = [];
    for (let i = 0; i < 6; i++) {
        vertices.push({
            x: size * Math.cos((Math.PI / 3) * i),
            y: size * Math.sin((Math.PI / 3) * i)
        });
    }
    hexCache[size] = vertices;
    return vertices;
}

function drawHex(ctx, x, y, size, color) {
    const vertices = generateHexVertices(size);

    ctx.beginPath();
    ctx.moveTo(x + vertices[0].x, y + vertices[0].y);
    for (let i = 1; i < 6; i++) {
        ctx.lineTo(x + vertices[i].x, y + vertices[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();
}

/*all grid
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(zoomLevel, zoomLevel);

    for (let row = 0; row < gridSizeHeight; row++) {
        for (let col = 0; col < gridSizeWidth; col++) {
            const x = col * hexWidth * 0.75;
            const y = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
            drawHex(ctx, x + hexWidth / 2, y + hexHeight / 2, hexWidth / 2, '#fff');
            ctx.fillStyle = '#000';
            ctx.fillText(`(${col},${row})`, x + hexWidth / 4, y + hexHeight / 2);
        }
    }

    ctx.restore();
}*/

//Partial grid draw based on visible
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.scale(zoomLevel, zoomLevel);
    drawNebulas();
    


    // Determine the visible area
    const visibleWidth = canvas.width / zoomLevel;
    const visibleHeight = canvas.height / zoomLevel;

    const startX = Math.max(0, Math.floor(viewport.scrollLeft / (hexWidth * 0.75)));
    const endX = Math.min(gridSizeWidth, Math.ceil((viewport.scrollLeft + visibleWidth) / (hexWidth * 0.75)));

    const startY = Math.max(0, Math.floor(viewport.scrollTop / hexHeight));
    const endY = Math.min(gridSizeHeight, Math.ceil((viewport.scrollTop + visibleHeight) / hexHeight));

    for (let row = startY; row < endY; row++) {
        for (let col = startX; col < endX; col++) {
            const x = col * hexWidth * 0.75;
            const y = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
            drawHex(ctx, x + hexWidth / 2, y + hexHeight / 2, hexWidth / 2, hexFill);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = 'lightgrey';
            ctx.fillText(`(${col},${row})`, x + hexWidth / 4, y + hexHeight / 2);
        }
    }

    ctx.restore();

    if (startHex.hex && reachableHexes.size > 0) {
        drawreachableHexes(reachableHexes, startHex);
    }
}

function getNeighbor(hex, direction) {
    const directions_even = [
        [0, -1],   // N
        [1, -1],   // NE
        [1, 0],    // SE
        [0, 1],    // S
        [-1, 0],   // SW
        [-1, -1]   // NW
    ];

    const directions_odd = [
        [0, -1],   // N
        [1, 0],    // NE
        [1, 1],    // SE
        [0, 1],    // S
        [-1, 1],   // SW
        [-1, 0]    // NW
    ];

    const [dCol, dRow] = hex[0] % 2 === 0 ? directions_even[direction] : directions_odd[direction];
    return [hex[0] + dCol, hex[1] + dRow];
}

function calculateReachable(hex, speed, turn_number, moved, remaining_moves, current_direction, reachable = new Map()) {
    const key = `${hex[0]},${hex[1]}`;
    if (remaining_moves === 0) {
        reachable.set(key, { hex, moved, remaining_moves, is_end: true });
        return reachable;
    }

    if (!reachable.has(key) || reachable.get(key).is_end === false) {
        reachable.set(key, { hex, moved, remaining_moves, is_end: remaining_moves === 0 });
    }

    const forward_hex = getNeighbor(hex, current_direction);
    if (isValidHex(forward_hex)) {
        calculateReachable(forward_hex, speed, turn_number, moved + 1, remaining_moves - 1, current_direction, reachable);
    }

    if ((moved % turn_number === 0) && (moved > 0)) {
        const left_direction = (current_direction - 1 + 6) % 6;
        const right_direction = (current_direction + 1) % 6;

        const left_hex = getNeighbor(hex, left_direction);
        if (isValidHex(left_hex)) {
            calculateReachable(left_hex, speed, turn_number, moved + 1, remaining_moves - 1, left_direction, reachable);
        }

        const right_hex = getNeighbor(hex, right_direction);
        if (isValidHex(right_hex)) {
            calculateReachable(right_hex, speed, turn_number, moved + 1, remaining_moves - 1, right_direction, reachable);
        }
    }

    return reachable;
}


function isValidHex(hex) {
    return hex[1] >= 0 && hex[1] < gridSizeHeight && hex[0] >= 0 && hex[0] < gridSizeWidth;
}

function handleHexClick(row, col) {
    //drawGrid();
    removeReachableHexes(reachableHexes, startHex);
    startHex = { hex: [col, row], moved: 0, remaining_moves: parseInt(speedInput.value), is_end: false };
    const speed = parseInt(speedInput.value);
    const turn_number = parseInt(turnInput.value);
    const direction = parseInt(directionInput.value);

    reachableHexes = calculateReachable([col, row], speed, turn_number, 0, speed, direction);

    drawreachableHexes(reachableHexes, startHex);
}

function removeReachableHexes(reachableHexes, startHex) {
    ctx.save();
    ctx.scale(zoomLevel, zoomLevel);  // Apply zoom level to the contex
    reachableHexes.forEach(({ hex, is_end }) => {
        const [c, r] = hex;
        const x = c * hexWidth * 0.75;
        const y = r * hexHeight + (c % 2 === 0 ? 0 : hexHeight / 2);
        drawHex(ctx, x + hexWidth / 2, y + hexHeight / 2, hexWidth / 2, hexFill);
        ctx.fillStyle = '#000';
        ctx.fillText(`(${c},${r})`, x + hexWidth / 4, y + hexHeight / 2);
    });
    ctx.restore();  // Restore the context to its original state
}

function drawreachableHexes(reachableHexes, startHex) {
    ctx.save();
    ctx.scale(zoomLevel, zoomLevel);  // Apply zoom level to the contex
    reachableHexes.forEach(({ hex, is_end }) => {
        const [c, r] = hex;
        const x = c * hexWidth * 0.75;
        const y = r * hexHeight + (c % 2 === 0 ? 0 : hexHeight / 2);
        drawHex(ctx, x + hexWidth / 2, y + hexHeight / 2, hexWidth / 2, is_end ? 'green' : 'yellow');
    });

    const x = startHex.hex.col * hexWidth * 0.75;
    const y = startHex.hex.row * hexHeight + ( startHex.hex.col % 2 === 0 ? 0 : hexHeight / 2);
    drawHex(ctx, x + hexWidth / 2, y + hexHeight / 2, hexWidth / 2, 'blue');
    ctx.restore();  // Restore the context to its original state
}

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoomLevel;
    const y = (event.clientY - rect.top) / zoomLevel;

    const col = Math.floor(x / (hexWidth * 0.75));
    const row = Math.floor((y - (col % 2 === 0 ? 0 : hexHeight / 2)) / hexHeight);

    handleHexClick(row, col);
});

function setZoom(newZoomLevel) {
    zoomLevel = newZoomLevel;
    canvas.width = ((gridSizeWidth * hexWidth * 0.75) + 15) * zoomLevel;
    canvas.height = ((gridSizeHeight * hexHeight) + 26) * zoomLevel;
    drawGrid();
    zoomLevelDisplay.textContent = `Zoom: ${Math.round(zoomLevel * 100)}%`;
}

canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const scaleAmount = 0.1;
    if (event.deltaY < 0 && zoomLevel < 2) {
        setZoom(zoomLevel + scaleAmount);
    } else if (event.deltaY > 0 && zoomLevel > 0.5) {
        setZoom(zoomLevel - scaleAmount);
    }
});

const viewport = document.getElementById('canvas-container');
let isScrolling;
viewport.addEventListener('scroll', () => {
    clearTimeout(isScrolling);
    isScrolling = setTimeout(() => {
        requestAnimationFrame(drawGrid);
    }, 66); // Roughly 15fps for debounce
});

createNebulas();
setZoom(1);
drawGrid();