// UI elements
const newMenuItem = document.querySelector("li[id=new-menu-item]");
const saveMenuItem = document.querySelector("li[id=save-menu-item]");
const clearMenuItem = document.querySelector("li[id=clear-menu-item]");
const aboutMenuItem = document.querySelector("div[id=about-menu-item]");
const newDialog = document.querySelector("dialog[id=new-dialog]");
const noDrawingDialog = document.querySelector("dialog[id=no-drawing-dialog]");
const aboutDialog = document.querySelector("dialog[id=about-dialog]");
const gridContainer = document.querySelector("div[class=grid-container]");

const newCancelButton = document.querySelector("button[id=new-cancel]");
const newConfirmButton = document.querySelector("button[id=new-confirm]");

const selectPixelSize = document.querySelector("select[id=select-pixel-size]");

const selectedColorSquare = document.querySelector("div[id=selected-color]");
const colorSquares = Array.from(document.getElementsByClassName("color-picker")).slice(1);
// Set by default the picked color as black
selectedColorSquare.classList.add("black");

// Global variables
const gridWidthPx = Math.round(0.6 * window.innerWidth);
const gridHeightPx = Math.round(0.8 * window.innerHeight);
const colorList = ["grey", "red", "orange", "yellow", "greenyellow", "green", "cyan", "blue", "purple", "pink"];
let selectedColor = "black";
let drawingAvailable = false;

// Resize elements upon initialization
resizeOps();

// Add listeners
// Fow window
window.addEventListener("resize", resizeOps);
// For menu items
newMenuItem.addEventListener("click", () => newDialog.showModal());
saveMenuItem.addEventListener("click", () => {
    if (drawingAvailable) {
        const bitmapArray = getArray();
        saveFile(generateBmp(bitmapArray));
    } else {
        noDrawingDialog.showModal();
    }
});
clearMenuItem.addEventListener("click", () => {
    if (drawingAvailable) {
        // Color all cells in white
        const gridCells = document.querySelectorAll(".grid-cell");
        for (const cell of gridCells) {
            if (cell.classList[2] === "white") {
                continue;
            }
            cell.classList.remove(cell.classList[2]);
            cell.classList.add("white");
        }
    } else {
        noDrawingDialog.showModal();
    }
})
aboutMenuItem.addEventListener("click", () => aboutDialog.showModal());
// For color pickers
colorSquares.forEach((item) => item.addEventListener("click", pickColor));
// For button to confirm grid creation
newConfirmButton.addEventListener("click", () => {
    const cellDimensions = selectPixelSize.value.split('x').map(Number);
    createCellGrid(cellDimensions[0], cellDimensions[1]);
})
// For touch screens
gridContainer.addEventListener("touchmove", colorCellByTouch);

// Callbacks
// To pick color
function pickColor(e) {
    selectedColor = e.target.classList[1];
    selectedColorSquare.classList.remove(selectedColorSquare.classList[1]);
    selectedColorSquare.classList.add(selectedColor);
}

// To color a grid cell (mouse over + mouse button 1 down)
function colorCell(e) {
    if (e.buttons === 1 || e.type === "click" || e.type === "mousedown") {
        e.target.classList.remove(e.target.classList[2]);
        const color = (selectedColor === "random")? getRandomColor() : selectedColor;
        e.target.classList.add(color);
    }
}

// To color a grid cell (touch move)
function colorCellByTouch(e) {
    e.preventDefault();
    // Get the touch element
    for (const touch of e.touches) {
        const gridCell = document.elementFromPoint(touch.clientX, touch.clientY);
        gridCell.classList.remove(gridCell.classList[2]);
        const color = (selectedColor === "random")? getRandomColor() : selectedColor;
        gridCell.classList.add(color);
    }
}

// Helper functions
// Resize element reference
function resizeOps() {
    document.documentElement.style.setProperty("--vh", window.innerHeight * 0.01 + "px");
};

// Get random color
function getRandomColor() {
    const index = Math.floor(colorList.length * Math.random());
    return colorList[index];
}

// Create cell grid
function createCellGrid(cellWidthPx, cellHeightPx) {
    const width = Math.floor(gridWidthPx / cellWidthPx);
    const height = Math.floor(gridHeightPx / cellHeightPx);
    // Remove old cells
    const gridRows = document.querySelectorAll(".grid-row");
    for (const row of gridRows) {
        row.remove();
    }
    // Select class
    let sizeClass = "small";
    if (cellWidthPx === 16 && cellHeightPx === 16) {
        sizeClass = "medium";
    } else if (cellWidthPx === 32 && cellHeightPx === 32) {
        sizeClass = "large";
    }
    // Create new cells
    for (let i = 0; i < height; i++) {
        const row = document.createElement("div");
        row.classList.add("grid-row");
        row.id = i.toString();
        for (let j = 0; j < width; j++) {
            const cell = document.createElement("div");
            cell.classList.add("grid-cell");
            cell.classList.add(sizeClass);
            cell.classList.add("white");
            cell.id = `(${i},${j})`;
            cell.draggable = false;
            row.appendChild(cell);
            cell.addEventListener("mousedown", colorCell);
            cell.addEventListener("mouseover", colorCell);
            cell.addEventListener("mousemove", () => false);
            cell.addEventListener('dragstart', (e) => e.preventDefault());
            cell.addEventListener('drop', (e) => e.preventDefault());
        }
        gridContainer.appendChild(row);
    }
    gridContainer.style.borderColor = "rgba(128, 128, 128, 1)";
    drawingAvailable = true;
}

// Shows a 'save file' window. It works in Chrome.
// In Firefox it will download the file without opening the window.
function saveFile(contents) {
    filename = 'Untitled.bmp';
    const opts = {type: 'image/bmp'};
    const file = new File([contents], '', opts);
    aDownloadFile.href = window.URL.createObjectURL(file);
    aDownloadFile.setAttribute('download', filename);
    aDownloadFile.click();
};

// Get array of pixel colors (Bitmap format)
function getArray() {
    if (!drawingAvailable) {
        return null;
    }
    // Array of pixel colors (integers to represent bytes + padding)
    const bitMapArray = [];
    // Get rows
    const gridRows = Array.from(document.querySelectorAll("div[class=grid-row]"));
    Object.keys(gridRows).reverse()
        .forEach(function(index) {
            bitMapArray.push([]);
            const cells = Array.from(gridRows[index].children);
            // Bitmap row size (not the row size of the pixel color array)
            // This is used to calculate the required padding bytes.
            const bmpRowSize = Math.ceil(24 * cells.length / 32) * 4;
            let numBytes = 0;
            for (let i = 0; i < cells.length; i++) {
                let colorStr = window.getComputedStyle(cells[i]).backgroundColor;
                let bgr;
                if (colorStr.includes("rgba")) {
                    bgr = colorStr
                        .replace('rgba(','')
                        .replace(')', '')
                        .replace(' ', '')
                        .split(',')
                        .reverse()
                        .slice(1)
                        .map(Number);
                } else if (colorStr.includes("rgb")) {
                    bgr = colorStr
                    .replace('rgb(','')
                    .replace(')', '')
                    .replace(' ', '')
                    .split(',')
                    .reverse()
                    .map(Number);
                }
                // Add padding
                numBytes += 3;
                if (i == cells.length - 1) {
                    if (numBytes < bmpRowSize) {
                        for (let j = 0; j < bmpRowSize - numBytes; j++) {
                            bgr.push(0);
                        }
                    }
                } else if (numBytes < bmpRowSize && numBytes + 3 > bmpRowSize) {
                    for (let j = 0; j < numBytes % 4; j++) {
                        bgr.push(0);
                    }
                    numBytes = 0;
                }
                bitMapArray[bitMapArray.length - 1].push(bgr);
            }
        });
    console.log(`Array dimensions = ${bitMapArray[0].length} x ${bitMapArray.length}`);
    return bitMapArray;
}

// Generate contents for an RGB24 BMP file
function generateBmp(arr) {
  
    function assign(obj, value, nBytes=1) {
      for (let i = 0; i < nBytes; i++) {
        obj["data"][obj["index"]+i] = (value>>(8*i))&0xff;
      }
      obj["index"] += nBytes;
    }
  
    const offset = 54;
    const width = arr[0].length;
    const height = arr.length;
  
    const flatArray = arr.flat(2);
    const totalLength = flatArray.length;

    const bmpRowSize = Math.ceil(24 * width / 32) * 4;
    const expTotalLength = bmpRowSize * height;
    console.log("Total length = " + totalLength);
    console.log("Theor length = " + expTotalLength);

    const dataObject = {
        "index": 0,
        "data": new Uint8Array(offset + totalLength)
    }
  
    // BMP Header
    assign(dataObject, "B".charCodeAt(0), 1);
    assign(dataObject, "M".charCodeAt(0), 1);      // ID field
    assign(dataObject, offset + totalLength, 4);   // BMP size
    assign(dataObject, 0, 4);                      // unused
    assign(dataObject, offset, 4);                 // pixel data offset
    
    // DIB Header                     
    assign(dataObject, 40, 4);                     // DIB header length
    assign(dataObject, width, 4);                  // image width
    assign(dataObject, height, 4);                 // image height
    assign(dataObject, 1, 2);                      // colour panes    
    assign(dataObject, 24, 2);                     // bits per pixel
    assign(dataObject, 0, 4);                      // compression method
    assign(dataObject, totalLength, 4);            // size of the raw data
    assign(dataObject, 2835, 4);                   // horizontal print resolution
    assign(dataObject, 2835, 4);                   // vertical print resolution
    assign(dataObject, 0, 4);                      // colour palette, 0 == 2^n
    assign(dataObject, 0, 4);                      // important colours

    // Pixel data
    for (let i = 0; i < totalLength; i++) {
        assign(dataObject, flatArray[i], 1);
    }
    console.log("Filled data: " + dataObject["index"]);
    return dataObject["data"];
  }
