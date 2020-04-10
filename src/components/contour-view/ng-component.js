import angular from 'angular';
import vueContainer from '../vue-container';
import vueComponent from "./index";
import makeAngularModule from '../utils';

const moduleName = 'contourView';
export default moduleName;

const propList = Array.isArray(vueComponent.props) ? vueComponent.props : Object.keys(vueComponent.props);
const template = `
    <contour-view
        ng-non-bindable
        :values="values" :n-rows="nRows" :n-cols="nCols"
        :min-x="minX" :max-x="maxX"
        :min-y="minY" :max-y="maxY"
        :color-scale="colorScale" :step="step" :major-every="majorEvery"
        :show-grid="showGrid" :grid-major="gridMajor" :grid-minor="gridMinor"
        :grid-nice="gridNice" :y-direction="yDirection"
        :show-label="showLabel" :label-font-size="labelFontSize" :on-scale-changed="onScaleChanged">
    </contour-view>
`;
makeAngularModule(moduleName, template, propList);
/*
const bindings = { };
propList.forEach(propKey => bindings[propKey] = '<');

angular
    .module(moduleName, [vueContainer])
    .component(moduleName, {
        template: `
            <vue-container vue-data='ngVue.vueData' vue-methods='ngVue.vueMethods'>
                <contour-view
                    ng-non-bindable
                    :values="values" :n-rows="nRows" :n-cols="nCols"
                    :min-x="minX" :max-x="maxX"
                    :min-y="minY" :max-y="maxY"
                    :color-scale="colorScale" :step="step" :major-every="majorEvery"
                    :show-grid="showGrid" :grid-major="gridMajor" :grid-minor="gridMinor" :grid-nice="gridNice"
                    :show-label="showLabel" :label-font-size="labelFontSize" :on-scale-changed="onScaleChanged">
                </contour-view>
            </vue-container>
        `,
        controller: Controller,
        controllerAs: 'ngVue',
        bindings
    })

function Controller($scope) {
    this.vueData = {};
    this.vueMethods = {};
    this.$onInit = function() {
        propList.forEach(propKey => {
            this.vueData[propKey] = this[propKey];
        })
    }
}
*/
