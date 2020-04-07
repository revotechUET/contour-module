import Vue from "vue/dist/vue.min.js";
import "!style-loader!css-loader!./style.css";
import * as d3 from "d3";
import template from "./template.html";
const componentName = "contour-view";

const component = {
    props: ['values', "nRows", "nCols", "colorScale"],
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
        }
    },
    methods: {
        dataFn: function() {
            return {
                values: this.values,
                width: this.nRows,
                height: this.nCols,
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

        d3Canvas.transition().duration(750).call(zoomBehavior.transform, d3.zoomIdentity);
    });
}

function onCanvasZoom(d3Container) {
    const transform = _.clone(d3.event.transform);
    updateCanvasTransformDebounced(d3Container, transform);
}

const updateCanvasTransformDebounced = _.throttle(updateCanvasTransform, 20);
function updateCanvasTransform(d3Container, transform) {
    requestAnimationFrame(() => {
        const d3Canvas = d3Container.select('canvas');
        const context = d3Canvas.node().getContext('2d');
        context.save();
        context.clearRect(0, 0, d3Canvas.attr("width"), d3Canvas.attr("height"));
        context.translate(transform.x, transform.y);
        context.scale(transform.k, transform.k);
        drawContourSync(d3Container);
        context.restore();
    })
}

function updateContourData(container, dataFn) {
    const d3Container = d3.select(container);
    const d3Canvas = d3Container.select('canvas');
    const context = d3Canvas.node().getContext("2d");
    const data = dataFn();

    // prepare data for contour;
    const contourData = d3.contours().size([data.width, data.height])(data.values);
    const mappedContourData = contourData.map(contourDataToPixelMap)

    const path2Ds = mappedContourData.map((contour, i) => {
        const path = d3.geoPath()(contour);
        return Object.assign(new Path2D(path), {fillColor: data.colorScale(contour.value)});
    })

    drawContourSync(d3Container, path2Ds);
}

let cachedPath2Ds = [];
function drawContourSync(d3Container, path2Ds) {
    const d3Canvas = d3Container.select('canvas');
    const context = d3Canvas.node().getContext("2d");

    cachedPath2Ds = path2Ds || cachedPath2Ds;
    context.clearRect(0, 0, d3Canvas.attr("width"), d3Canvas.attr("height"));
    cachedPath2Ds.forEach(path => {
        context.stroke(path);
        context.fillStyle = path.fillColor;
        context.fill(path);
    })
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
