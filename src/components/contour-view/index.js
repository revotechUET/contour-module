import Vue from "vue/dist/vue.min.js";
import "!style-loader!css-loader!./style.css";
import * as d3 from "d3";
import template from "./template.html";
const componentName = "contour-view";

const component = {
    props: ['values', "nRows", "nCols", "colorScale", "step", "majorTick", "showLabel"],
    template,
    mounted() {
        this.$nextTick(() => {
            initContour(this.$refs.drawContainer, this.dataFn);
        })
    },
    watch: {
        values: function(val) {
            console.log("watching values");
            updateContourData(this.$refs.drawContainer, this.dataFn);
        },
        colorScale: function() {
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        step: function(val) {
            console.log("onStep changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        majorTick: function(val) {
            console.log("majorTick changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        showLabel: function(val) {
            console.log("showLabel changed");
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
                majorTick: this.majorTick,
                showLabel: this.showLabel,
                colorScale: this.colorScale
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
        .attr("width", containerWidth || 500)
        .attr("height", containerHeight || 500);

    const zoomBehavior = d3.zoom()
            .on("zoom", () => onCanvasZoom(d3Container));
    d3Canvas.call(zoomBehavior);

    window.addEventListener("resize", (e) => {
        // update canvas size
        const containerWidth = d3Container.node().offsetWidth;
        const containerHeight = d3Container.node().offsetHeight;
        d3Canvas
            .attr("width", containerWidth || 500)
            .attr("height", containerHeight || 500);

        drawContourSync(d3Container);
    });
}

function onCanvasZoom(d3Container) {
    const transform = _.clone(d3.event.transform);
    updateCanvasTransformDebounced(d3Container, transform);
}

const updateCanvasTransformDebounced = _.throttle(updateCanvasTransform, 20);
function updateCanvasTransform(d3Container, transform) {
    requestAnimationFrame(() => {
        drawContourSync(d3Container, null, transform);
    })
}

const updateContourDataDebounced = _.debounce(updateContourData, 200);
function updateContourData(container, dataFn) {
    const d3Container = d3.select(container);
    const d3Canvas = d3Container.select('canvas');
    const context = d3Canvas.node().getContext("2d");
    const data = dataFn();

    const extent = d3.extent(data.values);
    const threshold = d3.range(extent[0], extent[1], data.step);

    // prepare data for contour;
    const contourData = d3.contours()
        .size([data.width, data.height])
        .thresholds(threshold)
        (data.values);
    const mappedContourData = contourData.map(contourDataToPixelMap)

    const path2Ds = mappedContourData.map((contour, i) => {
        const path = d3.geoPath()(contour);
        return Object.assign(new Path2D(path),
                {
                    fillColor: data.colorScale(contour.value),
                    isMajor: i % data.majorTick == 0,
                    pathData: _.clone(contour.coordinates),
                    value: contour.value.toFixed(0),
                });
    })
    path2Ds.showLabel = data.showLabel;

    drawContourSync(d3Container, path2Ds);
}

let cachedPath2Ds = [];
let cachedTransform = null;
function drawContourSync(d3Container, path2Ds, transform) {
    const d3Canvas = d3Container.select('canvas');
    const context = d3Canvas.node().getContext("2d");

    cachedPath2Ds = path2Ds || cachedPath2Ds;
    cachedTransform = transform || cachedTransform;
    context.save();
    context.clearRect(0, 0, d3Canvas.attr("width"), d3Canvas.attr("height"));
    if (cachedTransform) {
        context.translate(cachedTransform.x, cachedTransform.y);
        context.scale(cachedTransform.k, cachedTransform.k);
    }
    context.lineWidth = 1;
    context.strokeStyle = "black";
    cachedPath2Ds.forEach(path => {
        if (path.isMajor)
            context.lineWidth = 2;
        context.stroke(path);
        if (path.isMajor)
            context.lineWidth = 1;
        context.fillStyle = path.fillColor;
        context.fill(path);

    })

    if (cachedPath2Ds.showLabel) {
        context.strokeStyle = "white";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle =  "black";
        context.font = "2px Serif";
        context.lineWidth = 0.5;
        const LABEL_STEP = 50;
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
    }
    context.restore();
}

function contourDataToPixelMap({type, value, coordinates}) {
        return {type, value, coordinates: coordinates.map(rings => {
            return rings.map(points => {
                return points.map(([x, y]) => {
                    return [x, y];
                })
            })
        })}
    }
