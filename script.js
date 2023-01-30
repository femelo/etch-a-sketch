const newMenuItem = document.querySelector("a[id=new-menu-item]");
const saveMenuItem = document.querySelector("a[id=save-menu-item]");
const eraseMenuItem = document.querySelector("a[id=erase-menu-item]");
const aboutMenuItem = document.querySelector("a[id=about-menu-item]");
const newDialog = document.querySelector("dialog[id=new-dialog]");
const noDrawingDialog = document.querySelector("dialog[id=no-drawing-dialog]");
const aboutDialog = document.querySelector("dialog[id=about-dialog]");
const gridContainer = document.querySelector("div[class=grid-container]");

const newCancelButton = document.querySelector("button[id=new-cancel]");
const newConfirmButton = document.querySelector("button[id=new-confirm]");

const selectGridSize = document.querySelector("select[id=select-grid-size]");

const selectedColorSquare = document.querySelector("div[id=selected-color]");
const colorSquares = Array.from(document.getElementsByClassName("color-picker")).slice(1);
// Set by default the picked color as black
selectedColorSquare.classList.add("black");

// Global variables
let gridWidth = 0;
let gridHeight = 0;
let selectedColor = "black";
let drawingAvailable = false;

// Add listeners
newMenuItem.addEventListener("click", () => newDialog.showModal());
saveMenuItem.addEventListener("click", () => {
    if (drawingAvailable) {
        const bitmapArray = getArray();
        saveFile(generateBmp(bitmapArray));
    } else {
        noDrawingDialog.showModal();
    }
});
eraseMenuItem.addEventListener("click", () => {
    if (drawingAvailable) {
        // Color all cells in white
        const gridCells = document.querySelectorAll(".grid-cell");
        for (const cell of gridCells) {
            if (cell.classList[1] === "white") {
                continue;
            }
            cell.classList.remove(cell.classList[1]);
            cell.classList.add("white");
        }
    } else {
        noDrawingDialog.showModal();
    }
})
aboutMenuItem.addEventListener("click", () => aboutDialog.showModal());
colorSquares.forEach((item) => item.addEventListener("click", pickColor));

newConfirmButton.addEventListener("click", () => {
    const dimensions = selectGridSize.value.split('x');
    gridWidth = Number(dimensions[0]);
    gridHeight = Number(dimensions[1]);
    createCellGrid(gridWidth, gridHeight);
})

// Pick color
function pickColor(e) {
    selectedColor = e.target.classList[1];
    selectedColorSquare.classList.remove(selectedColorSquare.classList[1]);
    selectedColorSquare.classList.add(selectedColor);
}

// Key down
function colorCell(e) {
    if (e.buttons === 1 || e.type === "click" || e.type === "mousedown") {
        e.target.classList.remove(e.target.classList[1]);
        e.target.classList.add(selectedColor);
    }
}

// Create grid
function createCellGrid(width, height) {
    // Remove old cells
    const gridRows = document.querySelectorAll(".grid-row");
    for (const row of gridRows) {
        row.remove();
    }
    // Create new cells
    for (let i = 0; i < height; i++) {
        const row = document.createElement("div");
        row.classList.add("grid-row");
        row.id = i.toString();
        for (let j = 0; j < width; j++) {
            const cell = document.createElement("div");
            cell.classList.add("grid-cell");
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

function saveFile(contents) {
    filename = 'Untitled.bmp';
    const opts = {type: 'image/bmp'};
    const file = new File([contents], '', opts);
    aDownloadFile.href = window.URL.createObjectURL(file);
    aDownloadFile.setAttribute('download', filename);
    aDownloadFile.click();
};

function getArray() {
    if (!drawingAvailable) {
        return null;
    }
    // Array of strings
    const bitMapArray = [];
    // Get rows
    const gridRows = Array.from(document.querySelectorAll("div[class=grid-row]"));
    Object.keys(gridRows).reverse()
        .forEach(function(index) {
            bitMapArray.push([]);
            const cells = Array.from(gridRows[index].children);
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
  
    //BMP Header
    assign(dataObject, "B".charCodeAt(0), 1);
    assign(dataObject, "M".charCodeAt(0), 1);      // ID field
    assign(dataObject, offset + totalLength, 4);   // BMP size
    assign(dataObject, 0, 4);                      // unused
    assign(dataObject, offset, 4);                 // pixel data offset
    
    //DIB Header                     
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
