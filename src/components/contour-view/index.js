import Vue from "vue/dist/vue.min.js";
import "!style-loader!css-loader!./style.css";
import * as d3 from "d3";
import template from "./template.html";
import "../../vendors/ctxtextpath";
const componentName = "contour-view";

const component = {
    props: [
        'values', "nRows", "nCols", "colorScale", "step", "majorEvery",
        "labelFontSize", "showLabel",
        "showGrid", "gridMajor", "gridMinor", "gridNice",
        "minX", "maxX", "minY", "maxY",
        'onScaleChanged', 'yDirection', "showScale"
    ],
    template,
    mounted() {
        this.$nextTick(() => {
            initContour(this.$refs.drawContainer, this.dataFn);
        })
    },
    watch: {
        values: function(val) {
            // console.log("vue - values changed");
            updateContourData(this.$refs.drawContainer, this.dataFn, 'all');
        },
        colorScale: function() {
            // console.log("vue - colorScale changed")
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        step: function(val) {
            // console.log("vue - onStep changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        majorEvery: function(val) {
            // console.log("vue - majorEvery changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        showLabel: function(val) {
            // console.log("vue - showLabel changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        showGrid: function(val) {
            // console.log("vue - showGrid changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn, 'grid');
        },
        gridMinor: function(val) {
            // console.log("vue - gridMinor changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn, 'grid');
        },
        gridMajor: function(val) {
            // console.log("vue - gridMajor changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn, 'grid');
        },
        gridNice: function(val) {
            // console.log("vue - gridNice changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn, 'grid');
        },
        yDirection: function(val) {
            // console.log("vue - yDirection changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn, 'grid');
        },
        labelFontSize: function(val) {
            // console.log("vue - labelFontSize changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        showScale: function(val) {
            // console.log("vue - showScale changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        minX: function(val) {
            // console.log("vue - minX changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        maxX: function(val) {
            // console.log("vue - maxX changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        minY: function(val) {
            // console.log("vue - minY changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        maxY: function(val) {
            // console.log("vue - maxY changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
    },
    methods: {
        dataFn: function() {
            return {
                values: this.values,
                width: this.nRows,
                height: this.nCols,
                step: this.step,
                majorEvery: this.majorEvery,
                showLabel: this.showLabel,
                showGrid: this.showGrid,
                gridMajor: this.gridMajor,
                gridMinor: this.gridMinor,
                gridNice: this.gridNice,
                labelFontSize: this.labelFontSize,
                colorScale: this.colorScale,
                onScaleChanged: this.onScaleChanged,
                minX: this.minX,
                maxX: this.maxX,
                minY: this.minY,
                maxY: this.maxY,
                yDirection: this.yDirection,
                showScale: this.showScale,
            }
        }
    }
}
Vue.component(componentName, component);
export default component;

// FUNCTIONS DEFINITIONS
function initContour(container, dataFn) {
    const d3Container = d3.select(container);
    const containerWidth = d3Container.node().offsetWidth;
    const containerHeight = d3Container.node().offsetHeight;
    const d3Canvas = d3Container.append("canvas")
        .style('background-color', 'black')
        .attr("width", containerWidth || 500)
        .attr("height", containerHeight || 500);

    const zoomBehavior = d3.zoom()
            .on("zoom", () => onCanvasZoom(d3Container, dataFn().onScaleChanged));
    d3Canvas.call(zoomBehavior);

    window.addEventListener("resize", (e) => {
        // update canvas size
        const containerWidth = d3Container.node().offsetWidth;
        const containerHeight = d3Container.node().offsetHeight;
        d3Canvas
            .attr("width", containerWidth || 500)
            .attr("height", containerHeight || 500);

        drawContour(d3Container);
    });
}

function onCanvasZoom(d3Container, onScaleChanged) {
    const transform = _.clone(d3.event.transform);
    onScaleChanged && onScaleChanged(transform.k);
    updateCanvasTransformDebounced(d3Container, transform);
}

const updateCanvasTransformDebounced = _.throttle(updateCanvasTransform, 20);
function updateCanvasTransform(d3Container, transform) {
    requestAnimationFrame(() => {
        drawContour(d3Container, null, transform);
    })
}

const updateContourDataDebounced = _.debounce(updateContourData, 200);
function updateContourData(container, dataFn, forceDrawTarget=null) {
    const d3Container = d3.select(container);
    const d3Canvas = d3Container.select('canvas');
    const context = d3Canvas.node().getContext("2d");
    const data = dataFn();

    // scale to pixel
    const gridToScreenX = d3.scaleLinear()
        // .domain([0, data.width])
        // .range([0, d3Canvas.node().width]);
    const gridToScreenY = d3.scaleLinear()
        // .domain([0, data.height])
        // .range([0, d3Canvas.node().height]);
    // projection scale
    const gridToCoordinate = function(gridWidth, gridHeight, minX, maxX, minY, maxY, yDirection) {
        const scaleX = d3.scaleLinear()
            .domain([0, gridWidth])
            .range([minX, maxX]);

        const _yIsUp = yDirection == 'up';
        const _rangeScaleY = _yIsUp ? [maxY, minY]:[minY, maxY];
        const scaleY = d3.scaleLinear()
            .domain([0, gridHeight])
            .range(_rangeScaleY);
        const invert = function(coordinate) {
            return {
                x: scaleX.invert(coordinate.x),
                y: scaleY.invert(coordinate.y),
            }
        }
        const forward = function(cell) {
            return {
                x: scaleX(cell.x),
                y: scaleY(cell.y),
            }
        }

        forward.invert = invert;
        return forward;
    }

    if (!data.width || !data.height) return;

    const extent = d3.extent(data.values);
    const threshold = d3.range(extent[0], extent[1], data.step);

    // prepare data for contour;
    const contourData = d3.contours()
        .size([data.width, data.height])
        .thresholds(threshold)
        (data.values);
    Object.assign(contourData, {
        majorEvery: data.majorEvery,
        showLabel: data.showLabel,
        showScale: data.showScale,
        labelFontSize: data.labelFontSize,
        colorScale: data.colorScale,
        grid: {
            show: data.showGrid,
            nice: data.gridNice,
            width: data.width,
            height: data.height,
            nodeXToPixel: gridToScreenX,
            nodeYToPixel: gridToScreenY,
            nodeToCoordinate: gridToCoordinate(data.width, data.height, data.minX, data.maxX, data.minY, data.maxY, data.yDirection),
            majorTick: data.gridMajor,
            minorTick: data.gridMinor,
            minX: data.minX, maxX: data.maxX,
            minY: data.minY, maxY: data.maxY,
            yDirection: data.yDirection
        }
    })

    drawContour(d3Container, contourData, null, forceDrawTarget);
}

function getRoundNumber(number, base, flag='up') {
    if (base == 0) return number;
    const roundDown = Math.floor(number / base) * base;
    if (flag == 'down') return roundDown;
    const roundUp = roundDown + base;
    return roundUp;
}

function getGrid(contourData, transform) {
    console.log("%c vue - recalculating grid", 'color: red');
    const minX = contourData.grid.minX;
    const maxX = contourData.grid.maxX;
    const minY = contourData.grid.minY;
    const maxY = contourData.grid.maxY;
    const major = contourData.grid.majorTick || 5;
    const minor = contourData.grid.minorTick || 5;;
    const pixelScale = transform ? transform.k : 1;

    const nodeCellToZoneCoordinate = contourData.grid.nodeToCoordinate;
    const nodeXToPixel = contourData.grid.nodeXToPixel;
    const nodeYToPixel = contourData.grid.nodeYToPixel;

    const genNiceTicks = contourData.grid.nice || false;;


    // calculate nice tick values
    const desiredColumns = major * minor;

    const desiredStepX = genNiceTicks
        ? Math.pow(10, Math.round(Math.log10((maxX - minX) / desiredColumns)) || 1)
        : (maxX - minX) / desiredColumns;
    const desiredStartX = genNiceTicks
        ? getRoundNumber(minX, desiredStepX, 'up')
        : minX;
    const desiredStopX = genNiceTicks
        ? getRoundNumber(maxX, desiredStepX, 'down')
        : maxX;

    const desiredStepY = genNiceTicks
        ? Math.pow(10, Math.round(Math.log10((maxY - minY) / desiredColumns)) || 1)
        : (maxY - minY) / desiredColumns;
    const desiredStartY = genNiceTicks
        ? getRoundNumber(minY, desiredStepY, 'up')
        : minY;
    const desiredStopY = genNiceTicks
        ? getRoundNumber(maxY, desiredStepY, 'down')
        : maxY;

    const colData = d3
        .range(desiredStartX, desiredStopX + desiredStepX, desiredStepX)
        .map((colCoordinate, idx) => {
            const nodeStartPoint = nodeCellToZoneCoordinate.invert({x: colCoordinate, y: maxY});
            const nodeEndPoint = nodeCellToZoneCoordinate.invert({x: colCoordinate, y: minY})
            const startPointPx = {
                x: nodeXToPixel(nodeStartPoint.x) * pixelScale,
                y: nodeYToPixel(nodeStartPoint.y) * pixelScale
            }
            const endPointPx = {
                x: nodeXToPixel(nodeEndPoint.x) * pixelScale,
                y: nodeYToPixel(nodeEndPoint.y) * pixelScale
            }
            const startIsLo = startPointPx.y < endPointPx.y;
            return {
                isMajor: idx % minor == 0,
                lo: startIsLo ? startPointPx:endPointPx,
                hi: startIsLo ? endPointPx:startPointPx,
                value: _.round(colCoordinate, 2)
            }
        })

    const rowData = d3
        .range(desiredStartY, desiredStopY + desiredStepY, desiredStepY)
        .map((rowCoordinate, idx) => {
            const nodeStartPoint = nodeCellToZoneCoordinate.invert({x: minX, y: rowCoordinate});
            const nodeEndPoint = nodeCellToZoneCoordinate.invert({x: maxX, y: rowCoordinate})
            const startPointPx = {
                x: nodeXToPixel(nodeStartPoint.x) * pixelScale,
                y: nodeYToPixel(nodeStartPoint.y) * pixelScale
            }
            const endPointPx = {
                x: nodeXToPixel(nodeEndPoint.x) * pixelScale,
                y: nodeYToPixel(nodeEndPoint.y) * pixelScale
            }
            const startIsLo = startPointPx.x < endPointPx.x;
            return {
                isMajor: idx % minor == 0,
                lo: startIsLo ? startPointPx:endPointPx,
                hi: startIsLo ? endPointPx:startPointPx,
                value: _.round(rowCoordinate, 2)
            }
        })

    return {rows:rowData, cols: colData};
}

function getPath2Ds(contourData, transform, xToPixel, yToPixel) {
    console.log("%c vue - recalculating paths", 'color: red');
    const path2Ds = contourData
        .map(d => contourDataToPixelMap(d, transform, xToPixel, yToPixel))
        .map((contour, i) => {
            const path = d3.geoPath()(contour);
            return Object.assign(new Path2D(path), {
                pathData: _.clone(contour.coordinates),
            });
        });
    return path2Ds;
}

const SCALE_INDICATOR_MAX_WIDTH = 100; // 100px
function getScalePosition(contourData, transform, d3Canvas) {
    const screenWidth = d3Canvas.node().width;
    const screenHeight = d3Canvas.node().height;
    const nodeXToPixel = contourData.grid.nodeXToPixel;
    const nodeYToPixel = contourData.grid.nodeYToPixel;
    const zoomedScale = transform ? transform.k : 1;
    const nodeCellToZoneCoordinate = contourData.grid.nodeToCoordinate;

    const step = Math.pow(10, Math.floor(Math.log10(zoomedScale % 10)));

    // get scale indicator for x dimension
    let cellUnit = step;
    while(nodeXToPixel(cellUnit) * zoomedScale < SCALE_INDICATOR_MAX_WIDTH)
        cellUnit += step;

    const rootCoordinateValue = nodeCellToZoneCoordinate({x: 0, y: 0});
    let cellUnitCoordinateValue = nodeCellToZoneCoordinate({x: cellUnit, y: cellUnit});

    const _valueX = _.round(cellUnitCoordinateValue.x - rootCoordinateValue.x, 1);
    const startX = {
        x: (screenWidth) - 30 - nodeXToPixel(cellUnit) * zoomedScale,
        y: (screenHeight) - 30,
        value: _valueX,
    }
    const endX = {
        x: (screenWidth) - 30,
        y: (screenHeight) - 30,
        value: _valueX
        // value: _.round(cellUnit, 2)
    }

    // get scale indicator for y dimension
    cellUnit = step;
    while(nodeYToPixel(cellUnit) * zoomedScale < SCALE_INDICATOR_MAX_WIDTH)
        cellUnit += step;
    cellUnitCoordinateValue = nodeCellToZoneCoordinate({x: cellUnit, y: cellUnit});

    const _yIsUp = contourData.yDirection == 'up';
    const _valueY = Math.abs(_.round(cellUnitCoordinateValue.y - rootCoordinateValue.y, 1));
    const startY = {
        x: (screenWidth) - 30,
        y: (screenHeight) - 40 - nodeYToPixel(cellUnit) * zoomedScale,
        value: _valueY,
        // value: _.round(cellUnit, 2)
    }
    const endY = {
        x: (screenWidth) - 30,
        y: (screenHeight) - 40,
        value: _valueY
        // value: _.round(cellUnit, 2)
    }

    return {
        startX, endX,
        loY: _yIsUp ? startY:endY,
        hiY: _yIsUp ? endY:startY
    };
}

let cachedPath2Ds = [];
let cachedContourData = [];
let cachedTransform = null;
let cachedGrid = null;
let cachedScalePosition = null;
function drawContour(d3Container, contourData, transform, force=null) {
    const d3Canvas = d3Container.select('canvas');
    const context = d3Canvas.node().getContext("2d");

    const scaleChanged = (transform && cachedTransform && transform.k != cachedTransform.k)
        ? true:(cachedTransform ? false:true);

    cachedTransform = transform || cachedTransform;
    cachedContourData = contourData || cachedContourData;

    if (!cachedContourData.grid) return;

    const gridNodeXtoPixel = cachedContourData.grid.nodeXToPixel;
    const gridNodeYtoPixel = cachedContourData.grid.nodeYToPixel;
    cachedPath2Ds = (scaleChanged || force=="all" || force=="path")
        ? getPath2Ds(cachedContourData, cachedTransform, gridNodeXtoPixel, gridNodeYtoPixel)
        : cachedPath2Ds;
    cachedGrid = (scaleChanged || force=="all" || force=="grid")
        ? getGrid(cachedContourData, cachedTransform)
        : cachedGrid;

    cachedScalePosition = (scaleChanged || force=="all" || force=="scale")
        ? getScalePosition(cachedContourData, cachedTransform, d3Canvas)
        : cachedScalePosition;

    // editing props
    cachedPath2Ds.showLabel = cachedContourData.showLabel;
    cachedPath2Ds.labelFontSize = cachedContourData.labelFontSize;
    cachedPath2Ds.forEach((path, i) => {
        Object.assign(path, {
            fillColor: cachedContourData.colorScale(cachedContourData[i].value),
            isMajor: i % cachedContourData.majorEvery == 0,
            value: cachedContourData[i].value.toFixed(0),
        });
    })

    // context.save();
    // context.clearRect(0, 0, d3Canvas.attr("width"), d3Canvas.attr("height"));
    // if (cachedTransform) {
    //     context.translate(cachedTransform.x, cachedTransform.y);
    // }

    //draw grid
    if (cachedContourData.grid.show && cachedGrid) {
        requestAnimationFrame(() => {
            context.clearRect(0, 0, d3Canvas.attr("width"), d3Canvas.attr("height"));
            context.save();
            if (cachedTransform) {
                context.translate(cachedTransform.x, cachedTransform.y);
            }
            context.lineWidth = 1;
            context.strokeStyle = 'grey';
            context.beginPath();
            // draw minor ticks
            cachedGrid.rows.filter(row => !row.isMajor).forEach(row => {
                context.moveTo(row.lo.x, row.lo.y);
                context.lineTo(row.hi.x, row.hi.y);
            })
            cachedGrid.cols.filter(col => !col.isMajor).forEach(col => {
                context.moveTo(col.lo.x, col.lo.y);
                context.lineTo(col.hi.x, col.hi.y);
            })
            context.closePath();
            context.stroke();
            // draw major ticks
            context.lineWidth = 2;
            context.strokeStyle = 'white';
            context.fillStyle = 'white';
            context.font = `12px SansSerif`;
            context.beginPath();
            context.textAlign = 'end';
            const TEXT_PADDING = 10;
            cachedGrid.rows.filter(row => row.isMajor).forEach(row => {
                context.moveTo(row.lo.x, row.lo.y);
                context.lineTo(row.hi.x, row.hi.y);
                context.fillText(row.value, row.lo.x - TEXT_PADDING, row.lo.y);
            })
            context.textAlign = 'center';
            cachedGrid.cols.filter(col => col.isMajor).forEach(col => {
                context.moveTo(col.lo.x, col.lo.y);
                context.lineTo(col.hi.x, col.hi.y);
                context.fillText(col.value, col.lo.x, col.lo.y - TEXT_PADDING);
            })
            context.closePath();
            context.stroke();
            context.restore();
        })
    } else {
        requestAnimationFrame(() => {
            context.clearRect(0, 0, d3Canvas.attr("width"), d3Canvas.attr("height"));
        })
    }

    // draw contour paths
    requestAnimationFrame(() => {
        context.save();
        if (cachedTransform) {
            context.translate(cachedTransform.x, cachedTransform.y);
        }
        context.lineWidth = 1;
        context.strokeStyle = "black";
        cachedPath2Ds.forEach(path => {
            if (path.isMajor)
                context.lineWidth = 3;
            context.stroke(path);
            if (path.isMajor)
                context.lineWidth = 1;
            context.fillStyle = path.fillColor;
            context.fill(path);

        })
        context.restore();
    })

    if (cachedPath2Ds.showLabel) {
        requestAnimationFrame(() => {
            context.save();
            if (cachedTransform) {
                context.translate(cachedTransform.x, cachedTransform.y);
            }
            context.strokeStyle = "black";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle =  "white";
            context.font = `${cachedPath2Ds.labelFontSize}px Sans-Serif`;
            context.lineWidth = 1;
            const LABEL_STEP = 30;
            cachedPath2Ds.forEach((path) => {
                if (path.isMajor) {
                    // draw value above path
                    path.pathData.forEach((ring) => {
                        const points = ring[0];
                        let i = 0;
                        while(i < points.length) {
                            const _points = points.slice(i, i + LABEL_STEP);
                            context.textPath(path.value, _.flatten(_points));
                            i+=LABEL_STEP;
                        }
                    })
                }
            })
            context.restore();
        })
    }

    // draw scale indicator
    if (cachedContourData.showScale) {
        requestAnimationFrame(() => {
            // console.log("vue - scale indicator", cachedScalePosition);
            context.save();
            // if (cachedTransform) {
            //     context.translate(cachedTransform.x, cachedTransform.y);
            // }
            context.lineWidth = 2;
            context.strokeStyle = 'white';
            context.fillStyle = 'white';
            context.font = `12px SansSerif`;
            context.textAlign = 'end';

            context.beginPath()

            const startX = cachedScalePosition.startX;
            const endX = cachedScalePosition.endX;
            context.moveTo(startX.x, startX.y);
            context.lineTo(startX.x, startX.y + 10);
            context.lineTo(endX.x, endX.y + 10);
            context.lineTo(endX.x, endX.y);

            const startY = cachedScalePosition.loY;
            const endY = cachedScalePosition.hiY;
            context.moveTo(startY.x, startY.y);
            context.lineTo(startY.x + 10, startY.y);
            context.lineTo(endY.x + 10, endY.y);
            context.lineTo(endY.x, endY.y);
            // context.closePath();
            context.stroke();
            // context.fillText(start.value, start.x, start.y - 10);
            context.fillText(endX.value, endX.x - 5, endX.y);

            context.translate(endY.x, endY.y)
            context.rotate(-90 * Math.PI / 180);
            context.fillText(endY.value, -5, 0);

            context.restore();
        })
    }

    // context.restore();
}

function contourDataToPixelMap({type, value, coordinates}, transform, xToPixel, yToPixel) {
    const _transform = transform || {x: 0, y: 0, k: 1};
    return {type, value, coordinates: coordinates.map(rings => {
        return rings.map(points => {
            return points.map(([x, y]) => {
                return [
                    xToPixel(x) * _transform.k /*+ _transform.x*/,
                    yToPixel(y) * _transform.k /*+ _transform.y*/,
                ];
            })
        })
    })}
}
