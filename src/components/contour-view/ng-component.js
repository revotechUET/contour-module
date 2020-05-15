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
        :values="values" :contour-unit="contourUnit"
        :n-rows="nRows" :n-cols="nCols"
        :min-x="minX" :max-x="maxX"
        :min-y="minY" :max-y="maxY"
        :inc-x-direction="incXDirection" :inc-y-direction="incYDirection"
        :color-scale="colorScale" :step="step" :major-every="majorEvery"
        :show-grid="showGrid" :grid-major="gridMajor" :grid-minor="gridMinor"
        :grid-nice="gridNice" :y-direction="yDirection"
        :show-scale='showScale' :wells='wells' :show-well='showWell'
        :well-icon-size="wellIconSize"
        :show-trajectory='showTrajectory' :trajectories='trajectories'
        :show-label="showLabel" :label-font-size="labelFontSize"
        :show-color-scale-legend="showColorScaleLegend" :color-legend-ticks="colorLegendTicks"
        :disable-zoom="disableZoom"
        :disable-mouse-coordinate="disableMouseCoordinate"
        :enable-ruler-mode="enableRulerMode"
        :on-ruler-end="onRulerEnd"
        :on-mouse-move="onMouseMove"
        :negative-data="negativeData"
        :label-interval="labelInterval"
        :on-component-mounted="onComponentMounted"
        :on-scale-changed="onScaleChanged">
    </contour-view>
`;
makeAngularModule(moduleName, template, propList);
