import angular from 'angular';
import vueContainer from '../vue-container';
import vueComponent from "./index";
import makeAngularModule from '../utils';

const moduleName = 'contourFileImport';
export default moduleName;

const propList = Array.isArray(vueComponent.props) ? vueComponent.props : Object.keys(vueComponent.props);
const template = `
    <contour-file-import
        ng-non-bindable
        :on-data-changed="onDataChanged">
    </contour-file-import>
`;
makeAngularModule(moduleName, template, propList);
