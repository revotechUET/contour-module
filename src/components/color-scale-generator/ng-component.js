import angular from 'angular';
import vueContainer from '../vue-container';
import vueComponent from "./index";
import makeAngularModule from '../utils';

const moduleName = 'colorScaleGenerator';
export default moduleName;

const propList = Array.isArray(vueComponent.props) ? vueComponent.props : Object.keys(vueComponent.props);
const template = `
    <color-scale-generator
        ng-non-bindable
        :bar-height="barHeight" :min-val="minVal" :max-val="maxVal"
        :on-scale-changed="onScaleChanged"  :on-component-mounted="onComponentMounted"
        >
    </color-scale-generator>
`;
makeAngularModule(moduleName, template, propList);
