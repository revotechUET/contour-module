import _ from "lodash";
export {parseZmapGrid, toZmapFile};

/**
 * parse zmap grid file
 * a contour data contain:
 * headers:
 *  - gridNodesPerPhysicalLine
 *  - nodeWidth
 *  - numNullValue
 *  - textNullValue
 *  - numOfDecimal
 *  - startCol
 *  - numOfRows
 *  - numOfCols
 *  - minX
 *  - maxX
 *  - minY
 *  - maxY
 * data: 2 dimensional array with size: numOfRows(rows) and numOfCols(cols)
 *
 */
function parseZmapGrid(fileContent) {
    const lines = fileContent.split("\n");
    let headerLineIdx = -1;
    let startReadData = false;
    const returnData = {
        data: [],
        headers: {}
    }
    for (let i = 0; i < lines.length; ++i) {
        let line = lines[i].trim()
        if (line.length == 0) continue;
        if (line.match(/^!/)) {
            // comment
            continue;
        } else if (line.match(/^@(Grid|GRID)/)) {
            headerLineIdx = 0;
            const lineData = line.split(",");
            returnData.headers["gridNodesPerPhysicalLine"] = Number(lineData[2]);
            continue;
        } else if (headerLineIdx == 0) {
            // read first header line
            const lineData = line.split(",");
            if (lineData.length) {
                returnData.headers["nodeWidth"] = Number(lineData[0]);
                returnData.headers["numNullValue"] = Number(lineData[1]);
                returnData.headers["textNullValue"] = lineData[2];
                returnData.headers["numOfDecimal"] = Number(lineData[3]);
                returnData.headers["startCol"] = Number(lineData[4]);

                headerLineIdx = 1;
            }
        } else if (headerLineIdx == 1) {
            // read second header line
            const lineData = line.split(",");
            if (lineData.length) {
                returnData.headers["numOfRows"] = Number(lineData[0]);
                returnData.headers["numOfCols"] = Number(lineData[1]);
                returnData.headers["minX"] = Number(lineData[2]);
                returnData.headers["maxX"] = Number(lineData[3]);
                returnData.headers["minY"] = Number(lineData[4]);
                returnData.headers["maxY"] = Number(lineData[5]);

                headerLineIdx = 2;
            }
        } else if (headerLineIdx == 2) {
            const lineData = line.split(",");
            if (lineData.length) {
                returnData.headers["rotationAngle"] = Number(lineData[0]);
                returnData.headers["xDirection"] = Number(lineData[1]);
                returnData.headers["yDirection"] = Number(lineData[2]);
                headerLineIdx = 3;
            }
        } else if (headerLineIdx >= 3 && line.match(/^@$/)) {
            // reading data
            startReadData = true;
            continue;
        } else if (startReadData) {
            const nodeNums = returnData.headers.gridNodesPerPhysicalLine;
            const nodeWidth = returnData.headers.nodeWidth;
            const parsedArr = [];
            for(let j = 0; j < nodeNums; ++j) {
                const valueRaw = lines[i].substr(j*nodeWidth, nodeWidth);
                if (!valueRaw.length) continue;
                else if (valueRaw.length == 1 && valueRaw.charCodeAt(0) == 13) continue;
                const value = matchNullValue(valueRaw.trim(), returnData.headers["numNullValue"], returnData.headers["textNullValue"]);
                parsedArr.push(value);
            }
            if (parsedArr.length) {
                if (returnData.data[returnData.data.length - 1]
                    && returnData.data[returnData.data.length - 1].length < returnData.headers["numOfRows"])
                    returnData.data[returnData.data.length - 1] = returnData.data[returnData.data.length - 1]
                        .concat(parsedArr);
                else if (returnData.data.length < returnData.headers["numOfCols"])
                    returnData.data.push(parsedArr);
            }
            /*
            const lineData = line.split(/\s+/);
            if (lineData.length) {
                if (returnData.data[returnData.data.length - 1]
                    && returnData.data[returnData.data.length - 1].length < returnData.headers["numOfRows"])
                    //concatinating new data
                    returnData.data[returnData.data.length - 1] = returnData.data[returnData.data.length - 1]
                        .concat(lineData.map(v => matchNullValue(v, returnData.headers["numNullValue"])));
                else if (returnData.data.length < returnData.headers["numOfCols"]) {
                    returnData.data.push(lineData.map(v => matchNullValue(v, returnData.headers["numNullValue"])))
                }
            }
            */
            continue;
        } else if (headerLineIdx < 0) {
            continue;
        }
    }
    // transpose data for correct columns and rows
    returnData.data = _.zip.apply(_, returnData.data);
    return returnData;
}

function matchNullValue(v, nullValue) {
    const _value = Number(v);
    if (_value == nullValue) return null;
    return _value;
}

function toZmapFile(headers, data) {
    const {
        gridNodesPerPhysicalLine,
        nodeWidth, numNullValue, textNullValue, numOfDecimal, startCol,
        numOfRows, numOfCols, minX, maxX, minY, maxY,
        rotationAngle, xDirection, yDirection, ...other
    } = headers;
    let content =
`
@Grid HEADER, GRID, ${gridNodesPerPhysicalLine}
${nodeWidth}, ${numNullValue}, ${textNullValue}, ${numOfDecimal}, ${startCol}
${numOfRows}, ${numOfCols}, ${minX}, ${maxX}, ${minY}, ${maxY}
${rotationAngle}, ${yDirection}, ${xDirection}
@
`
    const transposedData = _.zip.apply(_, data);
    transposedData.forEach(row => {
        let rowContent = "";
        row.forEach((cell, cellIndex) => {
            if (cell == null)
                content += _.padStart(numNullValue.toFixed(numOfDecimal), nodeWidth, " ").substr(0, nodeWidth);
            else
                content += _.padStart(cell.toFixed(numOfDecimal), nodeWidth, " ").substr(0, nodeWidth);

            if ((cellIndex+1) % gridNodesPerPhysicalLine == 0)
                content += "\n";
        })
        if (rowContent.charCodeAt(rowContent.length - 1) != 10)
            rowContent += "\n";
        content += rowContent;
    });

    console.log(content);
    return content;
}