import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import './message-channel-stub'

global.IODIDE_EDITOR_ORIGIN = 'http://localhost'

global.IODIDE_JS_PATH = 'testing IODIDE_JS_PATH'
global.IODIDE_CSS_PATH = 'testing IODIDE_CSS_PATH'
global.IODIDE_VERSION = 'testing IODIDE_VERSION'
global.IODIDE_EVAL_FRAME_ORIGIN = 'testing IODIDE_EVAL_FRAME_ORIGIN'

Enzyme.configure({ adapter: new Adapter() })
