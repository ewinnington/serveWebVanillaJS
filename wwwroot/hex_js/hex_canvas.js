const canvas = document.getElementById('hexgrid');
const viewport = document.getElementById('canvas-container');
const ctx = canvas.getContext('2d');
const directionInput = document.getElementById('direction');
const speedInput = document.getElementById('speed');
const turnInput = document.getElementById('turn');
const zoomLevelDisplay = document.getElementById('zoom-level');
const firingDirectionInput = document.getElementById('firing-direction');
const firingArcInput = document.getElementById('arc');
const distanceInput = document.getElementById('distance');


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
}

function removeReachableHexes(reachableHexes, startHex) {
    drawGrid();
}

function drawReachableHexes(reachableHexes, startHex) {
    const full_hex = false;
    if(full_hex) {
        ctx.save();
        ctx.scale(zoomLevel, zoomLevel);  // Apply zoom level to the contex
        reachableHexes.forEach(({ hex, is_end }) => {
            const [c, r] = hex;
            const x = c * hexWidth * 0.75;
            const y = r * hexHeight + (c % 2 === 0 ? 0 : hexHeight / 2);
            drawHex(ctx, x + hexWidth / 2, y + hexHeight / 2, hexWidth / 2, is_end ? 'green' : 'yellow');
        });

        const [col, row] = startHex.hex;
        const x = col * hexWidth * 0.75;
        const y = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
        drawHex(ctx, x + hexWidth / 2, y + hexHeight / 2, hexWidth / 2, 'blue');
        ctx.restore();  // Restore the context to its original state
    } else
    {
        ctx.save();
        ctx.scale(zoomLevel, zoomLevel);  // Apply zoom level to the context
        reachableHexes.forEach(({ hex, is_end }) => {
            const [c, r] = hex;
            const x = c * hexWidth * 0.75;
            const y = r * hexHeight + (c % 2 === 0 ? 0 : hexHeight / 2);
            drawHexOutline(ctx, x + hexWidth / 2, y + hexHeight / 2, hexWidth / 2, is_end ? 'end' : 'path');
        });

        const [col, row] = startHex.hex;
        const x = col * hexWidth * 0.75;
        const y = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
        drawHexOutline(ctx, x + hexWidth / 2, y + hexHeight / 2, hexWidth / 2, 'start');
        ctx.restore();  // Restore the context to its original state
    }
}

function drawFiringArcHexes(reachableHexes, startHex) {
    ctx.save();
    ctx.scale(zoomLevel, zoomLevel);

    reachableHexes.forEach(({ hex }) => {
        const [c, r] = hex;
        const x = c * hexWidth * 0.75;
        const y = r * hexHeight + (c % 2 === 0 ? 0 : hexHeight / 2);
        drawHexOutline(ctx, x + hexWidth / 2, y + hexHeight / 2, hexWidth / 2, 'fire');
    });

    const [col, row] = startHex;
    const x = col * hexWidth * 0.75;
    const y = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
    drawHexOutline(ctx, x + hexWidth / 2, y + hexHeight / 2, hexWidth / 2, 'start');

    ctx.restore();
}

function drawHexOutline(ctx, x, y, size, type) {
    const vertices = generateHexVertices(size);
    let fillColor;
    let strokeColor;

    switch (type) {
        case 'start':
            fillColor = 'rgba(20, 20, 230, 0.5)'; // Light blue with transparency
            strokeColor = 'blue';
            break;
        case 'end':
            fillColor = 'rgba(144, 238, 144, 0.2)'; // Light green with transparency
            strokeColor = 'green';
            break;
        case 'path':
            fillColor = 'rgba(255, 255, 0, 0.2)';   // Light yellow with transparency
            strokeColor = 'yellow';
            break;
        case 'fire':
            fillColor = 'rgba(200, 0, 0, 0.2)';   // Light red with transparency
            strokeColor = 'red';
            break;
        default:
            fillColor = 'rgba(0, 0, 0, 1)';  //see through black
            strokeColor = 'black';
    }

    // Fill the hexagon with a transparent color to blend with the background
    ctx.beginPath();
    ctx.moveTo(x + vertices[0].x, y + vertices[0].y);
    for (let i = 1; i < 6; i++) {
        ctx.lineTo(x + vertices[i].x, y + vertices[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;  // Adjust the alpha value for transparency
    ctx.fill();

    // Draw the outline with a more visible stroke
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;  // Adjust the line width as needed
    ctx.stroke();
}



function setZoom(newZoomLevel) {
    zoomLevel = newZoomLevel;
    canvas.width = ((gridSizeWidth * hexWidth * 0.75) + 15) * zoomLevel;
    canvas.height = ((gridSizeHeight * hexHeight) + 26) * zoomLevel;
    drawGrid();
    if(startHex.hex)
        {
            drawReachableHexes(reachableHexes, startHex);
        }
    zoomLevelDisplay.textContent = `Zoom: ${Math.round(zoomLevel * 100)}%`;
}


///////// Event Listeners //////////
document.addEventListener('DOMContentLoaded', (event) => {
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    const canvas = document.getElementById('hexgrid');

    // Initialize mode
    let currentMode = 'path';

    // Event listener for mode change
    modeRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            currentMode = event.target.value;
            removeReachableHexes(reachableHexes, startHex);
            startHex = {};
            reachableHexes = new Map();
        });
    });

    // Event listener for canvas click
    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) / zoomLevel;
        const y = (event.clientY - rect.top) / zoomLevel;

        const col = Math.floor(x / (hexWidth * 0.75));
        const row = Math.floor((y - (col % 2 === 0 ? 0 : hexHeight / 2)) / hexHeight);

        if (currentMode === 'path') {
            handleHexClick(row, col);  // This function should be defined in hex_path.js
        } else if (currentMode === 'firing') {
            handleFiringArcClick(row, col);  // This function will be defined for firing arc calculations
        } else if (currentMode === 'pattern') {
            handlePatternClick(row, col);  // This function will be defined for distance calculations
        }
    });

    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        const scaleAmount = 0.1;
        if (event.deltaY < 0 && zoomLevel < 2) {
            setZoom(zoomLevel + scaleAmount);
        } else if (event.deltaY > 0 && zoomLevel > 0.5) {
            setZoom(zoomLevel - scaleAmount);
        }
    });


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
});



