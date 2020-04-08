import Vue from "vue/dist/vue.min.js";
import {Plugin} from "vue-fragment";
import _ from "lodash";
import components from "./components";
import template from "./template.html";
import "./vendors/ctxtextpath";
import * as d3 from "d3";

Vue.use(Plugin);

new Vue({
    el: "#vue-app",
    template,
    components,
    data: {
        headers: {},
        values: [],
        minValue: 0,
        maxValue: 1,
        colorScale: d3.scaleLinear().range(['red', 'blue']),
        step: 100,
        majorTick: 5,
        showLabel: true
    },
    methods: {
        onDataChanged: function(changedData) {
            console.log(changedData);
            this.headers = _.clone(changedData.headers);
            this.values = _.flatten(changedData.data);
            const domain = d3.extent(this.values);
            this.colorScale.domain(domain);
            this.minValue = domain[0];
            this.maxValue = domain[1];
        },
        onColorScaleChanged: function(colorScale) {
            this.colorScale = colorScale;
        }
    }
})
