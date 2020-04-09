import Vue from "vue/dist/vue.min.js";
import template from "./template.html";
import { parseZmapGrid } from "./parser";
const componentName = "contour-file-import";
const component = {
    props: {
        'onDataChanged': Function
    },
    data: () => ({
        headers: {},
        data: [],
    }),
    template,
    methods: {
        onFileChange: function(event) {
            if (!event.target.files[0]) return;
            const reader = new FileReader();
            reader.onload = e => {
                const parsedData = parseZmapGrid(e.target.result);
                this.headers = parsedData.headers;
                this.data = parsedData.data;
                this.onDataChanged(parsedData);
            }
            reader.readAsText(event.target.files[0]);
        }
    }
}

Vue.component(componentName, component);
export default component;
